import * as assert from 'assert';
import { ProjectService } from '../../src/services/ProjectService';

// fsモジュールをモック
jest.mock('fs');
import * as fs from 'fs';

// osモジュールをモック
jest.mock('os');
import * as os from 'os';

describe('ProjectService', () => {
    let service: ProjectService;
    const mockHomedir = '/mock/home';
    const mockClaudeProjectsPath = '/mock/home/.claude/projects';

    beforeEach(() => {
        // os.homedirのモック
        (os.homedir as jest.Mock).mockReturnValue(mockHomedir);
        
        // fs関数のモックをリセット
        jest.clearAllMocks();
        
        service = new ProjectService();
    });

    describe('getProjects', () => {
        it('ディレクトリが存在しない場合は空配列を返す', async () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            
            const projects = await service.getProjects();
            assert.deepStrictEqual(projects, []);
        });

        it('プロジェクトディレクトリを正しく読み込む', async () => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            
            // readdirSyncのモック（ディレクトリ一覧）
            (fs.readdirSync as jest.Mock).mockImplementation((path, options) => {
                if (path === mockClaudeProjectsPath && options?.withFileTypes) {
                    return [
                        { name: 'project-one', isDirectory: () => true },
                        { name: 'project-two', isDirectory: () => true },
                        { name: 'some-file.txt', isDirectory: () => false }  // ファイルは除外される
                    ];
                }
                // 各プロジェクトディレクトリ内のファイル
                if (path === `${mockClaudeProjectsPath}/project-one`) {
                    return ['session1.jsonl', 'session2.jsonl', 'other.txt'];
                }
                if (path === `${mockClaudeProjectsPath}/project-two`) {
                    return ['session3.jsonl'];
                }
                return [];
            });
            
            // statSyncのモック（ファイルの更新時刻）
            const mockDate1 = new Date('2024-01-01T10:00:00Z');
            const mockDate2 = new Date('2024-01-01T11:00:00Z');
            const mockDate3 = new Date('2024-01-01T12:00:00Z');
            
            (fs.statSync as jest.Mock).mockImplementation((path) => {
                if (path.includes('session1.jsonl')) return { mtime: mockDate1 };
                if (path.includes('session2.jsonl')) return { mtime: mockDate2 };
                if (path.includes('session3.jsonl')) return { mtime: mockDate3 };
                return { mtime: new Date() };
            });
            
            const projects = await service.getProjects();
            
            assert.strictEqual(projects.length, 2);
            
            // project-twoが新しいので先に来る
            assert.strictEqual(projects[0].id, 'project-two');
            assert.strictEqual(projects[0].name, 'project/two');
            assert.strictEqual(projects[0].conversationCount, 1);
            assert.strictEqual(projects[0].lastModified, mockDate3.toISOString());
            
            assert.strictEqual(projects[1].id, 'project-one');
            assert.strictEqual(projects[1].name, 'project/one');
            assert.strictEqual(projects[1].conversationCount, 2);
            assert.strictEqual(projects[1].lastModified, mockDate2.toISOString());
        });

        it('jsonlファイルがないプロジェクトはlastModifiedがnull', async () => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            
            (fs.readdirSync as jest.Mock).mockImplementation((path, options) => {
                if (path === mockClaudeProjectsPath && options?.withFileTypes) {
                    return [
                        { name: 'empty-project', isDirectory: () => true }
                    ];
                }
                if (path === `${mockClaudeProjectsPath}/empty-project`) {
                    return ['readme.txt'];  // jsonlファイルなし
                }
                return [];
            });
            
            const projects = await service.getProjects();
            
            assert.strictEqual(projects.length, 1);
            assert.strictEqual(projects[0].id, 'empty-project');
            assert.strictEqual(projects[0].conversationCount, 0);
            assert.strictEqual(projects[0].lastModified, null);
        });

        it('エラーが発生した場合は例外をスローする', async () => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readdirSync as jest.Mock).mockImplementation(() => {
                throw new Error('Permission denied');
            });
            
            await assert.rejects(
                async () => await service.getProjects(),
                /Permission denied/
            );
        });
    });

    describe('getProjectPath', () => {
        it('プロジェクトIDから正しいパスを返す', () => {
            const projectId = 'my-awesome-project';
            const expectedPath = `${mockClaudeProjectsPath}/${projectId}`;
            
            const actualPath = service.getProjectPath(projectId);
            
            assert.strictEqual(actualPath, expectedPath);
        });
    });
});