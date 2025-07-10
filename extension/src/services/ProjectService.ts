import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export interface Project {
    id: string;
    name: string;
    conversationCount: number;
    lastModified: string | null;
}

export class ProjectService {
    private get claudeProjectsPath(): string {
        return path.join(os.homedir(), '.claude', 'projects');
    }

    /**
     * Claude Codeのプロジェクト一覧を取得する
     * @returns プロジェクトの配列（最終更新日時の降順）
     */
    public async getProjects(): Promise<Project[]> {
        if (!fs.existsSync(this.claudeProjectsPath)) {
            return [];
        }

        const entries = fs.readdirSync(this.claudeProjectsPath, { withFileTypes: true });
        const projectDirs = entries.filter(entry => entry.isDirectory());
        
        const projects = await Promise.all(
            projectDirs.map(async (dir) => {
                const projectPath = path.join(this.claudeProjectsPath, dir.name);
                const files = fs.readdirSync(projectPath);
                const jsonlFiles = files.filter(file => file.endsWith('.jsonl'));
                
                let latestTime = null;
                if (jsonlFiles.length > 0) {
                    const stats = await Promise.all(
                        jsonlFiles.map(async (file) => {
                            const filePath = path.join(projectPath, file);
                            const stat = fs.statSync(filePath);
                            return stat.mtime;
                        })
                    );
                    latestTime = new Date(Math.max(...stats.map(d => d.getTime())));
                }
                
                return {
                    id: dir.name,
                    name: dir.name.replace(/-/g, '/'),
                    conversationCount: jsonlFiles.length,
                    lastModified: latestTime ? latestTime.toISOString() : null
                };
            })
        );
        
        // 最終更新日時の降順でソート
        projects.sort((a, b) => {
            if (!a.lastModified) return 1;
            if (!b.lastModified) return -1;
            return b.lastModified.localeCompare(a.lastModified);
        });

        return projects;
    }

    /**
     * プロジェクトのパスを取得する
     * @param projectId プロジェクトID
     * @returns プロジェクトの絶対パス
     */
    public getProjectPath(projectId: string): string {
        return path.join(this.claudeProjectsPath, projectId);
    }
}

// シングルトンインスタンスとしてエクスポート
export const projectService = new ProjectService();