import * as vscode from 'vscode';
import * as path from 'path';

export class Provider implements vscode.TreeDataProvider<vscode.TreeItem> {

  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  private filterText: string = '';
  private categories: vscode.TreeItem[] = [];
  private treeView?: vscode.TreeView<vscode.TreeItem>;

  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {

    const config = vscode.workspace.getConfiguration('nibit');
    const extensions = config.get<string[]>('extensions') || ['html'];
    if (!element) {

      this.categories = extensions.map(ext => {
        const category = new vscode.TreeItem(
          ext.toUpperCase(),
          vscode.TreeItemCollapsibleState.Expanded
        );
        category.id = ext;
        category.contextValue = 'category';
        return category;
      });

      return this.categories;
    }
    const extension = element.id;
    if (!extension) {
      return [];
    }

    const glob = `**/*.${extension}`;
    const files = await vscode.workspace.findFiles(glob);

    let filteredFiles = files;

    if (this.filterText) {
      filteredFiles = files.filter(file =>
        file.fsPath.toLowerCase().includes(this.filterText)
      );
    }

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

    if (this.filterText && filteredFiles.length === 0) {
      return [];
    }

    return filteredFiles.map(file => {

      const fileName = path.basename(file.fsPath);
      const lastDir = path.basename(path.dirname(file.fsPath));
      const label = `${lastDir}/${fileName}`;

      const relativePath = workspaceFolder
        ? path.relative(workspaceFolder.uri.fsPath, file.fsPath)
        : file.fsPath;

      const insertPath = '/' + relativePath.replace(/\\/g, '/');

      const item = new vscode.TreeItem(
        label,
        vscode.TreeItemCollapsibleState.None
      );

      item.resourceUri = file;
      item.tooltip = insertPath;
      item.contextValue = 'file';

      item.command = {
        command: 'vscode.open',
        title: 'Open File',
        arguments: [file]
      };

      return item;
    });
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getParent(element: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem> {
    return undefined;
  }


  async setFilter(text: string) {
    this.filterText = text.toLowerCase();
    this.refresh();
    await vscode.commands.executeCommand('workbench.actions.treeView.nibit-commands.refresh');

    if (!this.treeView || this.categories.length === 0) {
      return;
    }

    if (this.filterText) {
      for (const category of this.categories) {
        await this.treeView.reveal(category, { expand: true, select: false });
      }
    }
  }

  setTreeView(tree: vscode.TreeView<vscode.TreeItem>) {
    this.treeView = tree;
  }

}