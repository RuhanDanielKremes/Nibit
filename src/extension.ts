import * as vscode from 'vscode';
import { Provider } from './providers/Provider';

export function activate(context: vscode.ExtensionContext) {
	console.log('"nibit" is now active!');

	const provider = new Provider();

	const treeView = vscode.window.createTreeView('nibit-commands', {
		treeDataProvider: provider,
		showCollapseAll: true
	});

	provider.setTreeView(treeView);
	context.subscriptions.push(treeView);

	vscode.workspace.onDidChangeConfiguration(event => {
		if (event.affectsConfiguration('nibit.extensions')) {
			provider.refresh();
		}
	});

	context.subscriptions.push(
		vscode.commands.registerCommand('nibit.insertPath', (item: vscode.TreeItem) => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				return;
			}

			const insertPath = item.tooltip as string;

			editor.insertSnippet(new vscode.SnippetString(insertPath));
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('nibit.search', async () => {
			const text = await vscode.window.showInputBox({
				placeHolder: 'Search files...'
			});

			provider.setFilter(text || '');
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('nibit.clearSearch', () => {
			provider.setFilter('');
		})
	);

}

export function deactivate() {
	console.log('"nibit" has been deactivated.');
}