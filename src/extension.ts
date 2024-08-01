// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { window, commands, ExtensionContext } from 'vscode';
import { posix } from 'path';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let llcgConfig = vscode.workspace.getConfiguration('luau-class-generator');

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	let TypesFileUriPath = llcgConfig.get("libraryTypeFile");

	const setTypesFile = vscode.commands.registerCommand('luau-class-generator.setTypesFile', (Uri : vscode.Uri) => {
		TypesFileUriPath = Uri.path;

		llcgConfig.update("libraryTypeFile", TypesFileUriPath);

		console.log(llcgConfig.get("libraryTypeFile"));
	});

	context.subscriptions.push(setTypesFile);

	const newMethod = vscode.commands.registerCommand('luau-class-generator.newMethod', (Uri : vscode.Uri) => {
		if (Uri === undefined) {
			let possibleUri = vscode.window.activeTextEditor?.document.uri;
			if (possibleUri) {
				Uri = possibleUri;
			} else {
				return;
			}
		}

		let className : string;
		let codec: string = Uri.path;
		let libname = llcgConfig.get("libraryName");
		let libPrefix : string | undefined = llcgConfig.get("libraryPrefix");

		while(codec.match("/")) {
			codec = codec.slice(1);
		}

		let fileStrData = codec.split(".");
		let isUsingInitMethodology = false;
		className = fileStrData[0];

		if (className === "init") {
			let pathSplit = Uri.path.split("/");
			let folderParentName = pathSplit[pathSplit.length - 2];

			console.log(folderParentName, "folder name");

			isUsingInitMethodology = true;
			className = folderParentName;
		}

		let extensionLuaOrLuau = fileStrData[1].trim();

		vscode.window.showInputBox({
			"value": `${libPrefix}`,
			"prompt": "Name the method.",
			"title": "Method Name",
			"placeHolder": `${libPrefix}`,
		}).then(function(methodName : string | undefined) {
			if (methodName === undefined) {
				return;
			}
			vscode.window.showInformationMessage(`Initializing LCG new method ${methodName}`);
			vscode.window.showInputBox({
				"value": `${methodName} is designed to `,
				"prompt": "Describe the method's purpose.",
				"title": "Description",
				"placeHolder": `${methodName} is designed to `,
			}).then(function(methodDescription : string | undefined) {
				if (methodDescription === "" || methodDescription === undefined) {
					methodDescription = "No description provided.";
				}

				vscode.workspace.openTextDocument(Uri).then((doc) => {
					let newSource = doc.getText();
					let newMethodDefinition = `--[=[\n\t@within ${className}\n\n\t${methodDescription}\n]=]\nfunction ${className}:${methodName}()\n\tlocal obj : ${className} = self;\n\nend\n\n`;
		
					let idxBackcast = newSource.lastIndexOf("return");
					let front = newSource.slice(0, idxBackcast);
					let back = newSource.slice(idxBackcast, newSource.length);
					newSource = front + newMethodDefinition + back;
					
					vscode.workspace.fs.writeFile(Uri, Buffer.from(newSource));
				});
			});
		});

	});
	context.subscriptions.push(newMethod);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	function createNewClassMethod(Uri: vscode.Uri) {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		if (Uri === undefined) {
			let possibleUri = vscode.window.activeTextEditor?.document.uri;
			if (possibleUri) {
				Uri = possibleUri;
			} else {
				return;
			}
		}

		let className : string;
		let codec: string = Uri.path;
		let libname = llcgConfig.get("libraryName");
		let preambleIncluded = llcgConfig.get("includeLicensePreamble");
		let licenseName = llcgConfig.get("licenseName");
		let libPrefix : string | undefined = llcgConfig.get("libraryPrefix");

		while(codec.match("/")) {
			codec = codec.slice(1);
		}

		let fileStrData = codec.split(".");
		let isUsingInitMethodology = false;
		className = fileStrData[0];

		if (className === "init") {
			let pathSplit = Uri.path.split("/");
			let folderParentName = pathSplit[pathSplit.length - 2];

			console.log(folderParentName, "folder name");

			isUsingInitMethodology = true;
			className = folderParentName;
		}

		let extensionLuaOrLuau = fileStrData[1].trim();

		function DeclareType() {

		}

		function RunBoilerplate() {
			vscode.window.showInformationMessage('Initializing LCG new type definition ' + className + "CreateInfo");
			DeclareType();
			let TypesFileUriPath : string | undefined = llcgConfig.get("libraryTypeFile");
			let newTypeDefinition = `export type ${className}CreateInfo = {\n\tname : string;\n};\n\n`;

			if(TypesFileUriPath) {
				let typesFileUri = vscode.Uri.file(TypesFileUriPath);

				vscode.workspace.openTextDocument(typesFileUri).then((typesDoc) => {
					let newSource = typesDoc.getText();

					let idxBackcast = newSource.lastIndexOf("return");
					let front = newSource.slice(0, idxBackcast);
					let back = newSource.slice(idxBackcast, newSource.length);
					newSource = front + newTypeDefinition + back;
					
					vscode.workspace.fs.writeFile(typesFileUri, Buffer.from(newSource));
					DeclareClassAndBoilerPlate();
				});
			} else {
				DeclareClassAndBoilerPlate();
			}

			function DeclareClassAndBoilerPlate() {
				vscode.window.showInformationMessage('Initializing LCG new class named ' + className);

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

						let typesPathRelativeToScript = "script";
						let TypesFileUriPath : string | undefined = llcgConfig.get("libraryTypeFile");
						if (TypesFileUriPath) {
							if(TypesFileUriPath !== "...") {
								let lastCommonIndex = 0;
								let thisPath = Uri.path;
		
								let thisSplit = thisPath.split("/");
								let typesFilePathSplit = TypesFileUriPath.split("/");
								let noMatch = true;
								let idx = 0;
								let lastCommonParent = "";
								let shortenedThisSplit = "";
								let shortenedTypesSplit = "";
								while (noMatch) {
									let curFile = thisSplit[idx];
									let typeFile = typesFilePathSplit[idx];
		
									if (curFile === "") {
										idx += 1;
										continue;
									}
		
									if (curFile === undefined && typeFile === undefined) {
										break;
									}
		
									if (curFile !== typeFile) {
										idx += 1;
										if (curFile) {
											shortenedThisSplit = shortenedThisSplit + curFile + "/";
										}
										if (typeFile) {
											shortenedTypesSplit = shortenedTypesSplit + typeFile + "/";
										}
									} else {
										idx += 1;
										lastCommonParent = curFile;
									}
								}
		
								let numOfParents = shortenedThisSplit.split("/").length;
								if (isUsingInitMethodology) {
									numOfParents--;
								}
	
								for(let i = 1; i < numOfParents; i++) {
									typesPathRelativeToScript = typesPathRelativeToScript + ".Parent";
								}
		
								let splitty = shortenedTypesSplit.split("/");
								let numOfParents2 = splitty.length;
								for(let i = 0; i < numOfParents2; i++) {
									let file2 = splitty[i];
									if (file2 === undefined) {
										break;
									}
									if (file2 === "") {
										break;
									}
					
									let extensionless = file2.split(".");
									if (extensionless.length > 1) {
										file2 = extensionless[0];
									}
									typesPathRelativeToScript = typesPathRelativeToScript + "." + file2;
								}
							}
						}
		
						let classStringName = "className";
						if (libPrefix && libPrefix !== "") {
							classStringName = `${libPrefix}ClassName`;
						}
						let typeModuleVarName = `${libPrefix}Types`;
		
						let newContent: string = `${preamble}-- Library Dependencies\nlocal ${typeModuleVarName} = require(${typesPathRelativeToScript});\n\n-- Class Definition\n--[=[\n\t@class ${className}\n\n\t${str}\n]=]\nlocal ${className} = {};\n${className}.__index = ${className};\n\n-- Type Definition\nexport type ${className} = typeof(setmetatable({} :: {\n\t${classStringName} : "${className}";\n}, {} :: typeof(${className})))\n\n--[=[\n\t@within ${className}\n\n\t${str}\n\n\t@param ${className}CreateInfo heraTypes.${className}CreateInfo\n\t@return ${className}\n]=]\nfunction ${className}.new(${className}CreateInfo : ${typeModuleVarName}.${className}CreateInfo) : ${className}\n\tlocal class = setmetatable({}, ${className});\n\tclass.${classStringName} = "${className}";\n\tclass.name = ${className}CreateInfo.name;\n\n\treturn class;\nend\n\n--[=[\n\t@within ${className}\n\n]=]\nfunction ${className}:${libPrefix}Foo()\n\nend\n\nreturn ${className};`;
						/*
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
						*/
						vscode.workspace.fs.writeFile(Uri, Buffer.from(newContent)).then(function() {
							vscode.workspace.openTextDocument(Uri).then((doc : vscode.TextDocument) => {
								vscode.window.showTextDocument(doc);
							});
						});
					  });
				});
			}
		}

		if (libPrefix && !className.includes(libPrefix)) {
			let waiting = true;
			let rename = true;
			let renameSuggestion = libPrefix + className.charAt(0).toUpperCase() + className.slice(1);
			vscode.window
			.showInformationMessage(`Rename class to ${renameSuggestion}?`, "Yes", "No")
			.then(answer => {
				console.log("an answer has been received");
				if (answer === "Yes") {
					// Run function
					console.log("renaming.");
					rename = true;
				}
				waiting = false;

				if (rename) {
					let newPath = Uri.path;

					if (isUsingInitMethodology) {
						newPath = newPath.replace(`${className}`, `${renameSuggestion}`);
					} else {
						newPath = newPath.replace(`${className}.${extensionLuaOrLuau}`, `${renameSuggestion}.${extensionLuaOrLuau}`);
					}

					let newUri = vscode.Uri.file(newPath);
					let replaceUri = Uri;

					vscode.workspace.fs.rename(Uri, newUri, {
						overwrite: false
					});

					className = renameSuggestion;
					Uri = newUri;
				}

				RunBoilerplate();
			});
		} else {
			RunBoilerplate();
		}
	}
	const newClass = vscode.commands.registerCommand('luau-class-generator.newClass', (Uri: vscode.Uri) => {
		createNewClassMethod(Uri);
	});
	context.subscriptions.push(newClass);

	const newFileAndClass = vscode.commands.registerCommand('luau-class-generator.newFileAndClass', (Uri: vscode.Uri) => {
		if (Uri === undefined) {
			vscode.window.showErrorMessage("No folder provided when attempting to create a new file and Luau Class!");
			return;
		}
		let libPrefix : string | undefined = llcgConfig.get("libraryPrefix");

		vscode.window.showInputBox({
			"value": `${libPrefix}`,
			"prompt": "Name new Luau class",
			"title": "Class Name",
			"placeHolder": `${libPrefix}`,
		}).then(function(className : string | undefined) {
			if (className === undefined) {
				return;
			}
			vscode.window.showInformationMessage(`Initializing LCG new class ${className}`);
			const wsedit = new vscode.WorkspaceEdit();
			const wsPath = Uri.fsPath;
			const filePath = vscode.Uri.file(wsPath + `/${className}.luau`);
			vscode.window.showInformationMessage(filePath.toString());
			wsedit.createFile(filePath, { ignoreIfExists: true });
			vscode.workspace.applyEdit(wsedit);
			vscode.window.showInformationMessage(`Created a new file: ${className}.luau`);

			createNewClassMethod(filePath);
		});
	});
	context.subscriptions.push(newFileAndClass);
}

// This method is called when your extension is deactivated
export function deactivate() {}
