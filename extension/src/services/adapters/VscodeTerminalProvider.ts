import * as vscode from 'vscode';
import { Terminal, TerminalProvider } from '../TerminalService';

export class VscodeTerminalProvider implements TerminalProvider {
    getActiveTerminal(): Terminal | undefined {
        const terminal = vscode.window.activeTerminal;
        return terminal ? this.wrapTerminal(terminal) : undefined;
    }

    createTerminal(name: string): Terminal {
        const terminal = vscode.window.createTerminal(name);
        return this.wrapTerminal(terminal);
    }

    private wrapTerminal(terminal: vscode.Terminal): Terminal {
        return {
            show: () => terminal.show(),
            sendText: (text: string) => terminal.sendText(text)
        };
    }
}

export const vscodeTerminalProvider = new VscodeTerminalProvider();