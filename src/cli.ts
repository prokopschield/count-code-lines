#!/usr/bin/env node

import argv from '@prokopschield/argv';
import fs from 'fs';
import {
	getChildren,
	getNumberSpacePrepender,
	multilineCommentRegex,
	multilineCommentReplacer,
} from '.';

async function main() {
	const files = new Set<string>();

	const promises = argv.ordered
		.filter((a) => fs.existsSync(a))
		.map(getChildren);

	for (const dir_p of promises) {
		for (const file of await dir_p) {
			files.add(file);
		}
	}

	const files_data = [...files].map((file: string) =>
		fs.readFileSync(file, 'utf-8')
	);

	const file_lines = Array<string[]>();

	for (let file_data of files_data) {
		file_data = file_data.trim();
		file_data = file_data.replace(
			multilineCommentRegex,
			multilineCommentReplacer
		);
		file_lines.push(
			file_data.split(/\r?\n/g).map((line: string) => line.trim())
		);
	}

	const unique = new Set<string>();

	let empty_lines = 0;
	let comment_lines = 0;
	let directives = 0;
	let code_lines = 0;

	let is_reading_multiline_comment = false;

	for (const file of file_lines) {
		for (const line of file) {
			unique.add(line);
			if (!line) {
				++empty_lines;
			} else if (line.startsWith('//')) {
				++comment_lines;
			} else if (line.match(/^\#[a-z]+/)) {
				++directives;
			} else if (line.startsWith('#')) {
				++comment_lines;
			} else {
				++code_lines;
			}
		}
		is_reading_multiline_comment = false;
	}

	const totalLines = empty_lines + comment_lines + directives + code_lines;

	const spacePrepender = getNumberSpacePrepender(
		files.size,
		unique.size,
		empty_lines,
		comment_lines,
		directives,
		code_lines,
		totalLines
	);

	console.log(`${spacePrepender(files.size)} files`);
	console.log(`${spacePrepender(unique.size)} unique lines`);
	directives && console.log(`${spacePrepender(directives)} directives`);
	code_lines && console.log(`${spacePrepender(code_lines)} lines of code`);
	empty_lines && console.log(`${spacePrepender(empty_lines)} empty lines`);
	comment_lines && console.log(`${spacePrepender(comment_lines)} comments`);
	console.log(`${spacePrepender(totalLines)} total lines`);
}

main();
