import fs from 'fs';
import path from 'path';
import { cacheFn } from 'ps-std';

export const stat = cacheFn((file: string) =>
	fs.promises.stat(path.resolve(file))
);

export const readDir = cacheFn((file: string) =>
	fs.promises.readdir(path.resolve(file))
);

export const getChildren = cacheFn(async (dir: string) => {
	const s = await stat(dir);
	if (s.isFile()) {
		return [dir];
	} else {
		const children = new Set<string>();
		for (const sub of await readDir(dir)) {
			for (const child of await getChildren(path.resolve(dir, sub))) {
				children.add(child);
			}
		}
		return [...children];
	}
});

export const multilineCommentRegex =
	/[^\n]*\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\/[^\n]*/g;

export function multilineCommentReplacer(substr: string) {
	const match = substr.match(/\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//);

	const comment = match ? match[0] : '';

	const [pre, post] = substr.split(comment).map((a) => a.trim());

	const comment_lines = comment
		.replace(/^\/\*+/g, '')
		.replace(/\**\/$/, '')
		.split(/\n/g)
		.map((line) => line.trim());

	if (pre.includes('//')) {
		return `${pre} // ${comment_lines.join('\n')} */ ${post}`.replace(
			multilineCommentRegex,
			multilineCommentReplacer
		);
	}

	if (!post) {
		if (!pre) {
			return comment_lines.map((a) => `// ${a}`).join('\n');
		} else {
			return `${pre} ${comment_lines.map(commentOut).join('\n')}`;
		}
	} else if (comment_lines[comment_lines.length - 1] == '') {
		comment_lines.pop();
		return `${pre} ${unixJoinNL(comment_lines.map(commentOut))}${post}`;
	} else if (!pre) {
		return ` ${comment_lines
			.map((a) => (a ? `// ${a}` : ''))
			.join('\n')}\n${post}`.trim();
	} else if (comment_lines.includes('')) {
		const i = comment_lines.indexOf('');
		comment_lines.splice(i, 1);
		return `${pre} ${unixJoinNL(comment_lines.map(commentOut))}${post}`;
	} else {
		return `${pre} /* ${comment_lines.join('\n')} */ ${post}`;
	}
}

export function commentOut(line: string, index: number) {
	return line ? `// ${line}` : index ? '//' : '';
}

export function unixJoinNL(lines: string[]) {
	return lines.length ? lines.join('\n') + '\n' : '';
}

export function getNumberSpacePrepender(...numbers: number[]) {
	const topNum = Math.max(...numbers);
	const topNumLen = String(topNum).length;
	return (n: number) => (' '.repeat(topNumLen) + n).slice(-topNumLen);
}
