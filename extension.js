// The module 'vscode' contains the VS Code extensibility API
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	// 创建提示词存储管理器
	const promptManager = new PromptManager(context);
	
	// 注册Webview视图提供者
	const promptViewProvider = new PromptViewProvider(context.extensionUri, promptManager);
	
	// 注册Webview视图
	const promptView = vscode.window.registerWebviewViewProvider(
		'promptView',
		promptViewProvider
	);
	
	// 注册到上下文
	context.subscriptions.push(promptView);
	
	console.log('提示词管理插件已激活');
}

// 提示词管理类
class PromptManager {
	constructor(context) {
		this.context = context;
		this.prompts = [];
		this.dataPath = this.getStoragePath();
		this.loadPrompts();
	}

	getStoragePath() {
		return path.join(this.context.globalStorageUri.fsPath, 'prompts.json');
	}

	loadPrompts() {
		try {
			if (fs.existsSync(this.dataPath)) {
				const data = fs.readFileSync(this.dataPath, 'utf8');
				const parsed = JSON.parse(data);
				this.prompts = parsed.prompts || [];
			} else {
				// 确保目录存在
				const dir = path.dirname(this.dataPath);
				if (!fs.existsSync(dir)) {
					fs.mkdirSync(dir, { recursive: true });
				}
				this.prompts = [];
				this.savePrompts();
			}
		} catch (error) {
			vscode.window.showErrorMessage(`加载提示词失败: ${error.message}`);
			this.prompts = [];
		}
	}

	savePrompts() {
		try {
			const data = JSON.stringify({ prompts: this.prompts }, null, 2);
			fs.writeFileSync(this.dataPath, data, 'utf8');
		} catch (error) {
			vscode.window.showErrorMessage(`保存提示词失败: ${error.message}`);
		}
	}

	getAllPrompts() {
		return this.prompts;
	}

	addPrompt(title, content) {
		if (!title || !content) return false;
		
		const id = Date.now().toString();
		this.prompts.push({
			id,
			title,
			content
		});
		
		this.savePrompts();
		return true;
	}

	deletePrompt(id) {
		this.prompts = this.prompts.filter(p => p.id !== id);
		this.savePrompts();
		return true;
	}
}

// WebView视图提供者
class PromptViewProvider {
	constructor(extensionUri, promptManager) {
		this.extensionUri = extensionUri;
		this.promptManager = promptManager;
		this._view = null;
	}

	resolveWebviewView(webviewView, context, token) {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this.extensionUri]
		};

		webviewView.webview.html = this._getWebviewContent(webviewView.webview);

		// 处理来自WebView的消息
		webviewView.webview.onDidReceiveMessage(message => {
			switch (message.command) {
				case 'addPrompt':
					const success = this.promptManager.addPrompt(message.title, message.content);
					if (success) {
						this._updatePromptList();
						vscode.window.showInformationMessage(`提示词 "${message.title}" 已添加`);
					}
					break;
				case 'deletePrompt':
					const confirm = vscode.window.showWarningMessage(
						`确定要删除提示词吗？`,
						{ modal: true },
						'确定'
					).then(selection => {
						if (selection === '确定') {
							this.promptManager.deletePrompt(message.id);
							this._updatePromptList();
							vscode.window.showInformationMessage('提示词已删除');
						}
					});
					break;
				case 'copyPrompt':
					const prompt = this.promptManager.getAllPrompts().find(p => p.id === message.id);
					if (prompt) {
						vscode.env.clipboard.writeText(prompt.content);
						vscode.window.showInformationMessage(`提示词 "${prompt.title}" 已复制到剪贴板`);
					}
					break;
				case 'showError':
					vscode.window.showErrorMessage(message.message);
					break;
			}
		});

		// 初始加载提示词列表
		this._updatePromptList();
	}

	_updatePromptList() {
		if (this._view) {
			const prompts = this.promptManager.getAllPrompts();
			this._view.webview.postMessage({
				command: 'updatePromptList',
				prompts: prompts
			});
		}
	}

	_getWebviewContent(webview) {
		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.extensionUri, 'media', 'main.js')
		);
		const styleUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.extensionUri, 'media', 'style.css')
		);

		return `<!DOCTYPE html>
		<html lang="zh-CN">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<link href="${styleUri}" rel="stylesheet">
			<title>提示词管理</title>
		</head>
		<body>
			<div class="container">
				<div class="input-section">
					<input type="text" id="title-input" placeholder="提示词标题">
					<textarea id="content-input" placeholder="输入提示词内容"></textarea>
					<button id="save-button">保存</button>
				</div>
				<div class="divider"></div>
				<div class="list-header">我的提示词</div>
				<div class="prompt-list" id="prompt-list">
					<!-- 提示词列表将由JS动态生成 -->
				</div>
			</div>
			<script src="${scriptUri}"></script>
		</body>
		</html>`;
	}
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
