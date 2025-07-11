export interface Terminal {
    show(): void;
    sendText(text: string): void;
}

export interface TerminalProvider {
    getActiveTerminal(): Terminal | undefined;
    createTerminal(name: string): Terminal;
}

export class TerminalService {
    constructor(private terminalProvider: TerminalProvider) {}

    /**
     * コマンドをターミナルで実行する
     * @param command 実行するコマンド
     * @returns 実行結果
     */
    public async executeCommand(command: string): Promise<{ success: boolean; message?: string }> {
        try {
            // アクティブなターミナルを取得、なければ新規作成
            let terminal = this.terminalProvider.getActiveTerminal();
            if (!terminal) {
                terminal = this.terminalProvider.createTerminal('Claude Code');
            }
            
            // ターミナルを表示
            terminal.show();
            
            // コマンドを送信
            terminal.sendText(command);
            
            return {
                success: true,
                message: 'コマンドをターミナルに送信しました'
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'ターミナルへの送信に失敗しました'
            };
        }
    }
}

