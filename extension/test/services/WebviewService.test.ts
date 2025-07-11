import * as assert from 'assert';
import { WebviewService, Webview, WebviewUri, UriProvider } from '../../src/services/WebviewService';

// fsモジュールをモック
jest.mock('fs');
import * as fs from 'fs';

describe('WebviewService', () => {
    let service: WebviewService;
    let mockWebview: Webview;
    let mockExtensionUri: WebviewUri;
    let mockUriProvider: UriProvider;

    beforeEach(() => {
        // モックWebviewの設定
        mockWebview = {
            cspSource: 'webview-csp-source',
            asWebviewUri: jest.fn((uri: WebviewUri) => `webview-uri:${uri.fsPath}`)
        };
        
        // モック拡張機能URIの設定
        mockExtensionUri = {
            fsPath: '/mock/extension/path'
        };
        
        // モックURIプロバイダーの設定
        mockUriProvider = {
            joinPath: jest.fn((base: WebviewUri, ...paths: string[]) => ({
                fsPath: [base.fsPath, ...paths].join('/')
            }))
        };
        
        service = new WebviewService(mockUriProvider);
        
        // fs関数のモックをリセット
        jest.clearAllMocks();
    });

    describe('getHtmlContent', () => {
        it('アセットファイルが存在する場合は正しいHTMLを生成する', () => {
            // assetsディレクトリが存在し、ファイルを含む
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readdirSync as jest.Mock).mockReturnValue([
                'index-abc123.js',
                'index-def456.css',
                'other-file.txt'
            ]);
            
            const html = service.getHtmlContent(mockWebview, mockExtensionUri);
            
            // 基本的な構造をチェック
            assert.ok(html.includes('<!DOCTYPE html>'));
            assert.ok(html.includes('<html lang="ja">'));
            assert.ok(html.includes('<div id="root"></div>'));
            
            // CSPが正しく設定されているか
            assert.ok(html.includes(`style-src ${mockWebview.cspSource} 'unsafe-inline'`));
            
            // スクリプトとスタイルのURIが正しく設定されているか
            assert.ok(html.includes('webview-uri:/mock/extension/path/webview/dist/assets/index-abc123.js'));
            assert.ok(html.includes('webview-uri:/mock/extension/path/webview/dist/assets/index-def456.css'));
            
            // nonceが設定されているか（32文字のランダム文字列）
            const nonceMatch = html.match(/nonce="([A-Za-z0-9]{32})"/);
            assert.ok(nonceMatch);
            
            // VS Codeテーマカラーが設定されているか
            assert.ok(html.includes('--vscode-editor-background'));
            assert.ok(html.includes('--vscode-button-background'));
        });

        it('アセットファイルが存在しない場合でもHTMLを生成する', () => {
            // assetsディレクトリが存在しない
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            
            const html = service.getHtmlContent(mockWebview, mockExtensionUri);
            
            // 基本的な構造をチェック
            assert.ok(html.includes('<!DOCTYPE html>'));
            assert.ok(html.includes('<html lang="ja">'));
            assert.ok(html.includes('<div id="root"></div>'));
            
            // ファイルパスに空文字列が使用されているか
            assert.ok(html.includes('webview-uri:/mock/extension/path/webview/dist/assets/'));
        });

        it('nonceは呼び出しごとに異なる値を生成する', () => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readdirSync as jest.Mock).mockReturnValue(['index-abc.js', 'index-def.css']);
            
            const html1 = service.getHtmlContent(mockWebview, mockExtensionUri);
            const html2 = service.getHtmlContent(mockWebview, mockExtensionUri);
            
            const nonce1 = html1.match(/nonce="([A-Za-z0-9]{32})"/)?.[1];
            const nonce2 = html2.match(/nonce="([A-Za-z0-9]{32})"/)?.[1];
            
            assert.ok(nonce1);
            assert.ok(nonce2);
            assert.notStrictEqual(nonce1, nonce2);
        });

        it('URIプロバイダーを使用してパスを構築する', () => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readdirSync as jest.Mock).mockReturnValue(['index.js', 'index.css']);
            
            service.getHtmlContent(mockWebview, mockExtensionUri);
            
            // joinPathが正しく呼ばれているか確認
            const joinPathCalls = (mockUriProvider.joinPath as jest.Mock).mock.calls;
            assert.ok(joinPathCalls.some(call => 
                call[0] === mockExtensionUri && 
                call[1] === 'webview' && 
                call[2] === 'dist'
            ));
        });
    });
});