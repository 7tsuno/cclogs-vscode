import * as vscode from 'vscode';
import { WebviewUri, UriProvider } from '../WebviewService';

export class VscodeUriProvider implements UriProvider {
    joinPath(base: WebviewUri, ...paths: string[]): WebviewUri {
        // baseをvscode.Uriに変換
        const vscodeUri = vscode.Uri.file(base.fsPath);
        const joined = vscode.Uri.joinPath(vscodeUri, ...paths);
        return { fsPath: joined.fsPath };
    }
}

export const vscodeUriProvider = new VscodeUriProvider();