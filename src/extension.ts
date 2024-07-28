// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let llcgConfig = vscode.workspace.getConfiguration('luau-library-class-generator');

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	let TypesFileUriPath = llcgConfig.get("libraryTypeFile");

	const N = vscode.commands.registerCommand('luau-library-class-generator.setTypesFile', (Uri : vscode.Uri) => {
		TypesFileUriPath = Uri.path;

		llcgConfig.update("libraryTypeFile", TypesFileUriPath);

		console.log(llcgConfig.get("libraryTypeFile"));
	});

	context.subscriptions.push(N);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('luau-library-class-generator.newClass', (Uri: vscode.Uri) => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user

		let className : string;
		let codec: string = Uri.path;

		while(codec.match("/")) {
			codec = codec.slice(1);
		}

		let fileStrData = codec.split(".");

		className = fileStrData[0];

		vscode.window.showInformationMessage('Initializing LLCG new class named ' + className);
		console.log(Uri);

		vscode.window.showInputBox({
			"value": `The ${className} class is `,
			"prompt": "Describe the classes purpose.",
			"title": "Description",
			"placeHolder": `The ${className} class is designed to...`,
		}).then(function(str : string | undefined) {
			if (str === undefined) {
				str = "No definition provided.";
			}

			vscode.workspace.openTextDocument(Uri).then((document) => {
				let text = document.getText();
				
				let libname = llcgConfig.get("libraryName");
				let preambleIncluded = llcgConfig.get("includeLicensePreamble");
				let licenseName = llcgConfig.get("licenseName");
				let includeStrictFFlag = llcgConfig.get("includeStrictFFlag");
				let includeNativeFFlag = llcgConfig.get("includeNativeFFlag");
				let includeOptimize2FFlag = llcgConfig.get("includeOptimize2FFlag");
				let flags = "";
				if (includeNativeFFlag || includeNativeFFlag || includeOptimize2FFlag) {
					flags = flags + "\n\n";
				}
				if (includeStrictFFlag) {
					flags = flags + "--!strict\n";
				}
				if (includeNativeFFlag) {
					flags = flags + "--!native\n";
				}
				if (includeOptimize2FFlag) {
					flags = flags + "--!optimize 2\n";
				}
				let preamble = `-- This file is a part of the ${libname} library. ${libname} is licensed under the terms of the ${licenseName}. For more information, see LICENSE.md${flags}`;
				preamble = preamble + "\n";
				if (!preambleIncluded) {
					preamble = "";
				}

				let newContent: string = `${preamble}-- Library Dependencies\nlocal types = require(script.Parent.Parent.lib.Types);\n\n-- Class Definition\nlocal ${className} = {};\n${className}.__index = ${className};\n\n-- Type Definition\nexport type ${className} = typeof(setmetatable({} :: {\n\tclassName : "${className}";\n}, {} :: typeof(${className})))\n\n--[==[\n\t@class ${className}\n\n\t${str}\n\n\t@param ${className}CreateInfo;\n\t@return ${className};\n]==]\nfunction ${className}.new(${className}CreateInfo : types.${className}CreateInfo) : ${className}\n\tlocal class = setmetatable({}, ${className});\n\tclass.className = "${className}";\n\tclass.name = ${className}CreateInfo.name;\n\n\treturn class;\nend\n\nreturn ${className};`;
	
				const editor = vscode.window.activeTextEditor;
				let n = new vscode.Position(0, 1);
				let linecount = editor?.document.lineCount;
				if (linecount === undefined) {
					return;
				}
	
				let p = new vscode.Position(linecount, 1);
			
				let range = new vscode.Range(n, p);
				if (editor) {
					const document = editor.document;
					const word = document.getText();
					editor.edit(editBuilder => {
						editBuilder.replace(range, newContent);
					});
				}
			  });
		});


	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
