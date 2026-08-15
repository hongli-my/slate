// 内联到 index.html 后，window.__TAURI__ 已由 host 注入，无需 iframe 桥接
const _T = window.__TAURI__ || {};
const dlgOpen = _T.dialog ? _T.dialog.open : null;
const dlgSave = _T.dialog ? _T.dialog.save : null;
const fsReadText = _T.fs ? _T.fs.readTextFile : null;
const fsWriteText = _T.fs ? _T.fs.writeTextFile : null;
const fsReadDir = _T.fs ? _T.fs.readDir : null;
const fsRemove = _T.fs ? _T.fs.remove : null;
const fsWriteBytes = _T.fs ? _T.fs.writeFile : null;
const pathJoin = _T.path ? _T.path.join : null;
const invoke = (_T.core && _T.core.invoke) ? _T.core.invoke.bind(_T.core) : null;
function basename(p) { const i = String(p).lastIndexOf('/'); return i >= 0 ? p.slice(i + 1) : p; }

// ========== 原生菜单事件桥接 ==========
if (_T.event) {
    _T.event.listen('menu-action', (e) => {
        const a = e.payload;
        if (a === 'open-folder') doOpenFolder();
        else if (a === 'open-file') doOpenFiles();
        else if (a === 'save') saveCurrentFile();
        else if (a === 'new-file') doNewFile();
        else if (a === 'delete') deleteCurrentFile();
        else if (a === 'preview') togglePreview();
    });
}

// ========== 数据模型 ==========
let scannedFiles = [];
let folderTree = null;
let openTabs = [];
let activeTabId = null;
let cmEditor = null;
let tabIdCounter = 0;
let previewVisible = false;
let currentDirPath = null;  // 当前打开的文件夹绝对路径
let mdRenderTimer = null;
let syncScrolling = false;
let recents = [];  // 最近打开的文件/文件夹
let splitViewActive = false;  // 分栏视图
let rightEditor = null;       // 分栏右侧编辑器
let minimapOn = false;        // Minimap
let lightTheme = false;       // 亮色主题
let macroRecording = false;   // 宏录制中
let macroSteps = [];          // 宏步骤
const SESSION_KEY = 'slate.session.v1';

// ========== 初始化 ==========
function init() {
    setupResizer();
    setupEditor();
    setupShortcuts();
    setupMarked();
    loadRecents();
    restoreSession();
    setupMinimapEvents();
    // 检查URL参数,自动打开指定目录
    checkUrlParams();
}

function setupMinimapEvents() {
    const mm = document.getElementById('minimap');
    if (!mm) return;
    mm.addEventListener('mousedown', (e) => {
        if (!minimapOn) return;
        const rect = mm.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const info = cmEditor.getScrollInfo();
        const maxScroll = Math.max(0, info.height - info.clientHeight);
        cmEditor.scrollTo(null, (y / rect.height) * maxScroll);
    });
    window.addEventListener('resize', () => { if (minimapOn) renderMinimap(); });
}

function setupMarked() {
    marked.setOptions({
        gfm: true,
        breaks: true,
        highlight: function(code, lang) {
            if (lang && hljs.getLanguage(lang)) {
                try { return hljs.highlight(code, { language: lang }).value; } catch (e) {}
            }
            try { return hljs.highlightAuto(code).value; } catch (e) {}
            return code;
        }
    });
}

function setupEditor() {
    cmEditor = CodeMirror(document.getElementById('editorPane'), {
        value: '',
        theme: 'monokai',
        lineNumbers: true,
        styleActiveLine: true,
        matchBrackets: true,
        autoCloseBrackets: true,
        tabSize: 4,
        indentUnit: 4,
        indentWithTabs: false,
        lineWrapping: true,
        readOnly: true,
        foldGutter: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
        foldOptions: { minFoldSize: 2 },
        extraKeys: {
            'Cmd-F': function(cm) { showSearchReplacePanel(cm, true); },
            'Ctrl-F': function(cm) { showSearchReplacePanel(cm, true); },
            'Cmd-G': 'findNext',
            'Ctrl-G': 'findNext',
            'Cmd-Shift-G': 'findPrev',
            'Ctrl-Shift-G': 'findPrev',
            'Esc': function(cm) { closeSearchReplacePanel(); },
            // 代码补全
            'Ctrl-Space': 'autocomplete',
            // 多光标 / 多选
            'Cmd-D': function(cm) { selectNextOccurrence(cm); },
            'Ctrl-D': function(cm) { selectNextOccurrence(cm); },
            'Cmd-Shift-L': function(cm) { selectAllOccurrences(cm); },
            'Ctrl-Shift-L': function(cm) { selectAllOccurrences(cm); },
            'Cmd-U': 'undoSelection',
            'Ctrl-U': 'undoSelection',
            // 行操作
            'Cmd-Shift-K': function(cm) { deleteLine(cm); },
            'Cmd-Shift-D': function(cm) { duplicateLine(cm); },
            'Cmd-Ctrl-Up': function(cm) { moveLine(cm, -1); },
            'Cmd-Ctrl-Down': function(cm) { moveLine(cm, 1); },
            'Cmd-/': function(cm) { cm.toggleComment(); }
        }
    });
    cmEditor.getWrapperElement().style.display = 'none';
    // 代码补全 hint 来源（当前文件词 + 语言关键字）
    cmEditor.setOption('hintOptions', { hint: smartHint, completeSingle: false });

    cmEditor.on('cursorActivity', () => {
        updateStatusCursor();
        scheduleOccurrenceHighlight(cmEditor);
    });
    cmEditor.on('change', (cm, change) => {
        clearOccurrences();
        if (activeTabId !== null) {
            const tab = openTabs.find(t => t.id === activeTabId);
            if (tab) {
                if (!tab.modified) {
                    tab.modified = true;
                    renderTabsBar();
                }
                tab.content = cm.getValue();
            }
        }
        // 宏录制
        if (macroRecording && change.origin !== 'macro') {
            macroSteps.push({ text: change.text, from: change.from, to: change.to, origin: 'macro' });
        }
        // 实时更新 Markdown 预览
        if (previewVisible && isMarkdownFile()) {
            scheduleMdRender();
        }
        if (minimapOn) scheduleMinimapRender();
        if (rightEditor) rightEditor.setValue(cm.getValue());
        saveSession();
    });
    // Cmd+点击 添加多光标
    cmEditor.getWrapperElement().addEventListener('mousedown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.button === 0) {
            e.preventDefault();
            const pos = cmEditor.coordsChar({ left: e.clientX, top: e.clientY });
            cmEditor.addSelection(pos, pos);
        }
    });
    // 粘贴图片支持
    setupPasteImage();
}

// ========== Markdown 预览 ==========
function isMarkdownFile() {
    const tab = openTabs.find(t => t.id === activeTabId);
    return tab && /\.(md|markdown)$/i.test(tab.name);
}

// ========== 粘贴图片支持 ==========
function setupPasteImage() {
    cmEditor.getWrapperElement().addEventListener('paste', async (e) => {
        // 只在 Markdown 文件中启用
        if (!isMarkdownFile()) return;
        
        const clipboardData = e.clipboardData || window.clipboardData;
        if (!clipboardData) return;
        
        // 检查是否有图片文件
        const items = clipboardData.items;
        let imageItem = null;
        
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                imageItem = items[i];
                break;
            }
        }
        
        if (!imageItem) return;
        
        // 阻止默认粘贴行为
        e.preventDefault();
        
        const blob = imageItem.getAsFile();
        if (!blob) return;
        
        // 生成文件名
        const timestamp = new Date().getTime();
        const ext = blob.type.replace('image/', '').replace('jpeg', 'jpg');
        const defaultName = `image-${timestamp}.${ext}`;
        
        // 询问用户如何处理图片
        const choice = await showImagePasteDialog(defaultName);
        if (!choice) return; // 用户取消
        
        if (choice.action === 'base64') {
            // 转换为 Base64 嵌入
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target.result;
                insertImageMarkdown(choice.name, base64);
            };
            reader.readAsDataURL(blob);
        } else if (choice.action === 'save') {
            // 保存到当前文件夹
            if (!currentDirPath) {
                toast('请先打开一个文件夹才能保存图片');
                return;
            }
            
            try {
                const imgPath = await pathJoin(currentDirPath, choice.name);
                const arr = new Uint8Array(await blob.arrayBuffer());
                await fsWriteBytes(imgPath, arr);
                
                // 插入相对路径
                insertImageMarkdown(choice.name, choice.name);
                
                // 刷新文件树显示新图片
                await doRefreshFolder();
                toast('图片已保存: ' + choice.name);
            } catch (err) {
                toast('保存图片失败: ' + err.message);
            }
        }
    });
}

function insertImageMarkdown(alt, src) {
    const cursor = cmEditor.getCursor();
    const markdown = `![${alt}](${src})`;
    cmEditor.replaceSelection(markdown);
    // 移动光标到图片语法之后
    const newPos = { line: cursor.line, ch: cursor.ch + markdown.length };
    cmEditor.setCursor(newPos);
}

// 显示图片粘贴选项对话框
function showImagePasteDialog(defaultName) {
    return new Promise((resolve) => {
        // 创建对话框
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; inset: 0; background: rgba(0,0,0,0.5);
            display: flex; align-items: center; justify-content: center;
            z-index: 10001;
        `;
        
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: #4b4b4b; border: 1px solid #666;
            border-radius: 8px; padding: 20px; min-width: 320px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        `;
        
        dialog.innerHTML = `
            <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #e0e0e0; font-weight: 500;">粘贴图片</h3>
            <p style="margin: 0 0 15px 0; font-size: 13px; color: #aaa;">检测到剪贴板中的图片，请选择处理方式：</p>
            <div style="margin-bottom: 15px;">
                <label style="display: block; font-size: 12px; color: #999; margin-bottom: 5px;">图片名称</label>
                <input type="text" id="imgNameInput" value="${defaultName}" 
                    style="width: 100%; padding: 8px 10px; background: #3a3a3a; border: 1px solid #555;
                           border-radius: 4px; color: #e0e0e0; font-size: 13px; box-sizing: border-box;">
            </div>
            <div style="display: flex; gap: 10px;">
                <button id="btnBase64" style="flex: 1; padding: 8px; background: #5a5a5a; border: 1px solid #777;
                    border-radius: 4px; color: #e0e0e0; cursor: pointer; font-size: 13px;">
                    Base64 嵌入
                </button>
                <button id="btnSave" style="flex: 1; padding: 8px; background: #5a8a5a; border: 1px solid #7ab87a;
                    border-radius: 4px; color: #fff; cursor: pointer; font-size: 13px;                     ${!currentDirPath ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
                    保存到文件夹
                </button>
                <button id="btnCancel" style="padding: 8px 15px; background: transparent; border: 1px solid #666;
                    border-radius: 4px; color: #999; cursor: pointer; font-size: 13px;">
                    取消
                </button>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // 聚焦到输入框
        setTimeout(() => {
            const input = document.getElementById('imgNameInput');
            input.focus();
            input.select();
        }, 10);
        
        // 按钮事件
        document.getElementById('btnBase64').onclick = () => {
            const name = document.getElementById('imgNameInput').value.trim() || defaultName;
            document.body.removeChild(overlay);
            resolve({ action: 'base64', name });
        };
        
        document.getElementById('btnSave').onclick = () => {
            if (!currentDirPath) return;
            const name = document.getElementById('imgNameInput').value.trim() || defaultName;
            document.body.removeChild(overlay);
            resolve({ action: 'save', name });
        };
        
        document.getElementById('btnCancel').onclick = () => {
            document.body.removeChild(overlay);
            resolve(null);
        };
        
        // 点击遮罩关闭
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
                resolve(null);
            }
        };
        
        // 回车确认（默认 Base64）
        document.getElementById('imgNameInput').onkeydown = (e) => {
            if (e.key === 'Enter') {
                const name = e.target.value.trim() || defaultName;
                document.body.removeChild(overlay);
                resolve({ action: 'base64', name });
            }
        };
    });
}

function scheduleMdRender() {
    if (mdRenderTimer) clearTimeout(mdRenderTimer);
    mdRenderTimer = setTimeout(renderMarkdownPreview, 120);
}

function renderMarkdownPreview() {
    const pane = document.getElementById('previewPane');
    if (!pane || !previewVisible) return;
    const content = cmEditor.getValue();
    try {
        let html = marked.parse(content);
        pane.innerHTML = html;
        // 后处理：标题折叠 + 代码块复制
        addCodeCopyButtons(pane);
        addHeadingFold(pane);
    } catch (e) {
        pane.innerHTML = '<p style="color:#f44;">渲染失败</p>';
    }
}

// ========== 代码块复制按钮 ==========
function addCodeCopyButtons(container) {
    const pres = container.querySelectorAll('pre');
    pres.forEach(pre => {
        const btn = document.createElement('button');
        btn.className = 'code-copy-btn';
        btn.textContent = '复制';
        btn.onclick = (e) => {
            e.stopPropagation();
            const code = pre.querySelector('code');
            const text = code ? code.textContent : pre.textContent;
            navigator.clipboard.writeText(text).then(() => {
                btn.textContent = '已复制';
                btn.classList.add('copied');
                setTimeout(() => {
                    btn.textContent = '复制';
                    btn.classList.remove('copied');
                }, 1500);
            }).catch(() => {
                // fallback
                const ta = document.createElement('textarea');
                ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
                document.body.appendChild(ta); ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                btn.textContent = '已复制';
                btn.classList.add('copied');
                setTimeout(() => {
                    btn.textContent = '复制';
                    btn.classList.remove('copied');
                }, 1500);
            });
        };
        pre.style.position = 'relative';
        pre.appendChild(btn);
    });
}

// ========== 标题层级折叠 ==========
function addHeadingFold(container) {
    // 收集所有子节点
    const children = Array.from(container.childNodes);
    // 找出所有标题元素
    const headingTags = new Set(['H1','H2','H3','H4','H5','H6']);
    const headings = [];

    children.forEach((node, index) => {
        if (node.nodeType === 1 && headingTags.has(node.tagName)) {
            headings.push({ node, index, level: parseInt(node.tagName[1]) });
        }
    });

    if (headings.length === 0) return;

    // 从后往前处理，这样插入 wrapper 不会影响前面的索引
    for (let i = headings.length - 1; i >= 0; i--) {
        const h = headings[i];
        const hNode = h.node;
        const hLevel = h.level;

        // 找到该标题下属的内容：到下一个同级或更高级标题为止
        const sectionContent = [];
        let nextSibling = hNode.nextSibling;
        while (nextSibling) {
            if (nextSibling.nodeType === 1 && headingTags.has(nextSibling.tagName)) {
                const nextLevel = parseInt(nextSibling.tagName[1]);
                if (nextLevel <= hLevel) break; // 同级或更高级标题，停止
            }
            sectionContent.push(nextSibling);
            nextSibling = nextSibling.nextSibling;
        }

        if (sectionContent.length === 0) continue;

        // 创建折叠容器
        const section = document.createElement('div');
        section.className = 'md-section';

        // 把内容移入容器
        sectionContent.forEach(n => section.appendChild(n));

        // 在标题后插入容器
        hNode.after(section);

        // 给标题加折叠箭头和点击事件
        const arrow = document.createElement('span');
        arrow.className = 'md-fold-arrow';
        arrow.textContent = '\u25BC';

        // 保存标题原始内容
        const titleText = hNode.innerHTML;
        hNode.innerHTML = '';
        hNode.className = 'md-heading';
        hNode.appendChild(arrow);
        const textSpan = document.createElement('span');
        textSpan.innerHTML = titleText;
        hNode.appendChild(textSpan);

        hNode.onclick = () => {
            const isCollapsed = section.classList.toggle('collapsed');
            arrow.classList.toggle('collapsed', isCollapsed);
        };
    }
}

function togglePreview() {
    previewVisible = !previewVisible;
    const pane = document.getElementById('previewPane');
    const btn = document.getElementById('btnPreviewFloat');
    if (previewVisible) {
        if (isMarkdownFile()) {
            renderMarkdownPreview();
        } else {
            pane.innerHTML = '<div style="padding:40px;text-align:center;color:#666;">预览仅支持 Markdown 文件</div>';
        }
        pane.style.display = 'block';
        btn.classList.add('active');
        btn.innerHTML = '&#9998; 编辑';
        // 预览时隐藏 minimap（预览覆盖编辑区）
        const mm = document.getElementById('minimap');
        if (mm) mm.classList.remove('visible');
    } else {
        pane.style.display = 'none';
        btn.classList.remove('active');
        btn.innerHTML = '&#128065; 预览';
        const mm = document.getElementById('minimap');
        if (mm && minimapOn) mm.classList.add('visible');
        setTimeout(() => cmEditor.refresh(), 10);
    }
}

// ========== 文件类型 → CodeMirror mode ==========
function getMode(filename) {
    const ext = (filename.split('.').pop() || '').toLowerCase();
    const map = {
        'c': 'text/x-csrc', 'h': 'text/x-csrc',
        'cpp': 'text/x-c++src', 'cc': 'text/x-c++src', 'cxx': 'text/x-c++src', 'hpp': 'text/x-c++src',
        'java': 'text/x-java', 'kt': 'text/x-kotlin', 'scala': 'text/x-scala',
        'm': 'text/x-objectivec', 'mm': 'text/x-objectivec',
        'py': 'text/x-python',
        'js': 'text/javascript', 'jsx': 'text/javascript',
        'ts': 'text/typescript', 'tsx': 'text/typescript',
        'json': 'application/json',
        'go': 'text/x-go',
        'rs': 'text/x-rustsrc',
        'sh': 'text/x-sh', 'bash': 'text/x-sh', 'zsh': 'text/x-sh', 'fish': 'text/x-sh',
        'php': 'text/x-php',
        'rb': 'text/x-ruby',
        'lua': 'text/x-lua',
        'sql': 'text/x-sql',
        'swift': 'text/x-swift',
        'html': 'text/html', 'htm': 'text/html', 'vue': 'text/html', 'svelte': 'text/html',
        'xml': 'application/xml',
        'css': 'text/css', 'scss': 'text/css', 'less': 'text/css',
        'md': 'text/x-markdown', 'markdown': 'text/x-markdown',
        'yml': 'text/x-yaml', 'yaml': 'text/x-yaml',
        'cmake': 'text/x-cmake',
        'pl': 'text/x-perl', 'pm': 'text/x-perl',
        'r': 'text/x-rsrc',
        'ini': 'text/x-properties', 'cfg': 'text/x-properties', 'conf': 'text/x-properties',
        'txt': 'text/plain',
        'makefile': 'text/x-sh', 'dockerfile': 'text/x-sh'
    };
    return map[ext] || 'text/plain';
}

function getLanguageLabel(filename) {
    const ext = (filename.split('.').pop() || '').toLowerCase();
    const labels = {
        'c':'C','h':'C Header','cpp':'C++','cc':'C++','cxx':'C++','hpp':'C++ Header',
        'py':'Python','js':'JavaScript','jsx':'JavaScript','ts':'TypeScript','tsx':'TypeScript',
        'java':'Java','kt':'Kotlin','scala':'Scala','go':'Go','rs':'Rust',
        'sh':'Shell','bash':'Shell','zsh':'Shell','fish':'Shell',
        'php':'PHP','rb':'Ruby','lua':'Lua','sql':'SQL','swift':'Swift',
        'html':'HTML','htm':'HTML','vue':'Vue','css':'CSS','xml':'XML',
        'json':'JSON','yml':'YAML','yaml':'YAML','md':'Markdown','markdown':'Markdown',
        'txt':'Plain Text','ini':'INI','cfg':'Config','conf':'Config',
        'm':'Objective-C','mm':'Objective-C','pl':'Perl','pm':'Perl','r':'R'
    };
    return labels[ext] || 'Plain Text';
}

// ========== 支持的文件扩展名 ==========
const SUPPORTED_EXTENSIONS = new Set([
    'md','txt','markdown','json','xml','html','htm','css','js','ts','jsx','tsx','vue','svelte',
    'yml','yaml','ini','cfg','conf',
    'c','cpp','cc','cxx','h','hpp','py','sh','bash','zsh','fish',
    'java','kt','swift','go','rs','php','rb','lua','pl','pm','sql','r',
    'm','mm','scala','groovy','cmake','makefile','dockerfile'
]);

function isSupportedFile(name) {
    const ext = name.toLowerCase().split('.').pop();
    const lowerName = name.toLowerCase();
    return SUPPORTED_EXTENSIONS.has(ext) || lowerName === 'makefile' || lowerName === 'dockerfile';
}

// ========== 读取文件内容 ==========
function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = e => reject(e);
        reader.readAsText(file);
    });
}

// ========== 检查URL参数并显示打开目录提示 ==========
function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const folder = params.get('folder');
    if (folder) {
        // 延迟一下,确保页面加载完成后再显示提示
        setTimeout(() => {
            showOpenFolderBanner(folder);
        }, 300);
    }
}

// ========== 显示打开目录提示条 ==========
function showOpenFolderBanner(folderName) {
    const banner = document.createElement('div');
    banner.id = 'openFolderBanner';
    banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 20px;
        text-align: center;
        z-index: 10000;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 15px;
    `;
    banner.innerHTML = `
        <span>📂 点击打开 ~/Desktop/${folderName} 目录</span>
        <button id="openFolderBtn" style="
            background: white;
            color: #667eea;
            border: none;
            padding: 6px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
        ">打开目录</button>
        <button id="closeBannerBtn" style="
            background: rgba(255,255,255,0.2);
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
        ">忽略</button>
    `;
    document.body.appendChild(banner);
    document.body.style.paddingTop = '50px';

    document.getElementById('openFolderBtn').onclick = () => {
        doOpenFolder();
        closeBanner();
    };

    document.getElementById('closeBannerBtn').onclick = closeBanner;

    function closeBanner() {
        banner.remove();
        document.body.style.paddingTop = '0';
    }
}

// ========== 打开文件夹 ==========
async function doOpenFolder() {
    try {
        const dirPath = await dlgOpen({ directory: true });
        if (!dirPath) return; // 用户取消
        await loadFolder(dirPath);
    } catch (err) {
        console.error(err);
        toast('打开失败: ' + err.message);
    }
}

// 按绝对路径加载文件夹（对话框和历史记录共用）
async function loadFolder(dirPath) {
    currentDirPath = dirPath;
    toast('正在扫描...');
    scannedFiles = [];
    await scanDir(dirPath, '');
    if (scannedFiles.length === 0) { toast('没有找到支持的文件'); return; }
    scannedFiles.sort((a, b) => a.path.localeCompare(b.path));
    folderTree = buildTree(scannedFiles, basename(dirPath));
    renderTree();
    toast('已加载 ' + scannedFiles.length + ' 个文件');
    addRecent('folder', dirPath, basename(dirPath));
}

async function scanDir(dirPath, basePath) {
    let entries = [];
    try { entries = await fsReadDir(dirPath); } catch (e) { return; }
    for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        const entryPath = basePath ? basePath + '/' + entry.name : entry.name;
        const fullPath = await pathJoin(dirPath, entry.name);
        if (entry.isDirectory) {
            await scanDir(fullPath, entryPath);
        } else if (entry.isFile && isSupportedFile(entry.name)) {
            scannedFiles.push({ name: entry.name, path: entryPath, absPath: fullPath });
        }
    }
}


async function doOpenFiles() {
    try {
        const selected = await dlgOpen({ multiple: true });
        if (!selected) return;
        const paths = Array.isArray(selected) ? selected : [selected];
        for (const p of paths) {
            const content = await fsReadText(p);
            addTab(basename(p), basename(p), content, p);
            addRecent('file', p, basename(p));
        }
    } catch (err) {
        toast('打开失败: ' + err.message);
    }
}

// ========== 构建文件夹树 ==========
function buildTree(files, rootName) {
    const root = { name: rootName, type: 'dir', children: [], expanded: true };
    for (const f of files) {
        const parts = f.path.split('/');
        let node = root;
        for (let i = 0; i < parts.length - 1; i++) {
            let child = node.children.find(c => c.type === 'dir' && c.name === parts[i]);
            if (!child) {
                child = { name: parts[i], type: 'dir', children: [], expanded: false };
                node.children.push(child);
            }
            node = child;
        }
        node.children.push({ name: f.name, type: 'file', fileRef: f });
    }
    sortTree(root);
    return root;
}

function sortTree(node) {
    if (!node.children) return;
    node.children.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
        return a.name.localeCompare(b.name);
    });
    for (const c of node.children) { if (c.type === 'dir') sortTree(c); }
}

// ========== 渲染文件树 ==========
function renderTree() {
    const el = document.getElementById('fileTree');
    el.innerHTML = '';

    renderRecentSection(el);

    // 显示真正未保存的文件（没有 handle 且不是从文件夹扫描来的）
    const unsavedTabs = openTabs.filter(tab => {
        // 没有 handle 说明从未保存过
        return !tab.absPath && !scannedFiles.some(f => f.path === tab.path);
    });
    if (unsavedTabs.length > 0) {
        const header = document.createElement('div');
        header.className = 'tree-item';
        header.style.paddingLeft = '8px';
        header.style.color = '#999';
        header.style.fontSize = '11px';
        header.style.fontWeight = '600';
        header.style.textTransform = 'uppercase';
        header.style.letterSpacing = '0.5px';
        header.style.padding = '6px 8px 2px';
        header.style.cursor = 'default';
        header.textContent = '未保存文件';
        el.appendChild(header);
        for (const tab of unsavedTabs) {
            const row = document.createElement('div');
            row.className = 'tree-item';
            if (tab.id === activeTabId) row.classList.add('selected');
            row.style.paddingLeft = '20px';
            const icon = document.createElement('span');
            icon.className = 'icon';
            icon.textContent = getFileIcon(tab.name);
            row.appendChild(icon);
            const label = document.createElement('span');
            label.textContent = tab.name + (tab.modified ? ' \u2022' : '');
            row.appendChild(label);
            row.onclick = () => switchToTab(tab.id);
            el.appendChild(row);
        }
    }

    if (!folderTree) {
        if (unsavedTabs.length === 0 && recents.length === 0) {
            el.innerHTML = '<div style="padding:20px;text-align:center;color:#888;font-size:13px;">点击上方按钮打开文件夹</div>';
        }
        return;
    }
    renderTreeNode(folderTree, el, 0);
}

// ========== 最近打开记录 ==========
async function loadRecents() {
    if (!invoke) return;
    try {
        recents = (await invoke('recents_list')) || [];
        renderTree();
    } catch (e) { console.error('加载最近记录失败:', e); }
}

async function addRecent(kind, path, name) {
    if (!invoke) return;
    try {
        recents = await invoke('recents_add', { item: { kind, path, name, time: Date.now() } });
        renderTree();
    } catch (e) { console.error('保存最近记录失败:', e); }
}

async function clearRecents() {
    if (!invoke) return;
    try {
        await invoke('recents_clear');
        recents = [];
        renderTree();
        toast('已清除最近记录');
    } catch (e) { console.error('清除最近记录失败:', e); }
}

// 在文件树顶部渲染"最近打开"分组
function renderRecentSection(el) {
    if (!recents || recents.length === 0) return;
    const header = document.createElement('div');
    header.className = 'tree-item';
    header.style.cssText = 'padding:6px 8px 2px;color:#8b919a;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;cursor:default;display:flex;align-items:center;justify-content:space-between;';
    const title = document.createElement('span');
    title.textContent = '最近打开';
    header.appendChild(title);
    const clearBtn = document.createElement('span');
    clearBtn.textContent = '清除';
    clearBtn.style.cssText = 'font-size:10px;color:#8b919a;cursor:pointer;text-transform:none;letter-spacing:0;padding:0 4px;border-radius:3px;';
    clearBtn.onmouseenter = () => { clearBtn.style.color = '#1a73e8'; };
    clearBtn.onmouseleave = () => { clearBtn.style.color = '#8b919a'; };
    clearBtn.onclick = (e) => { e.stopPropagation(); clearRecents(); };
    header.appendChild(clearBtn);
    el.appendChild(header);

    for (const r of recents.slice(0, 10)) {
        const row = document.createElement('div');
        row.className = 'tree-item';
        row.style.paddingLeft = '20px';
        const icon = document.createElement('span');
        icon.className = 'icon';
        icon.textContent = r.kind === 'folder' ? '\uD83D\uDCC1' : getFileIcon(r.name);
        row.appendChild(icon);
        const label = document.createElement('span');
        label.textContent = r.name;
        label.title = r.path;
        row.appendChild(label);
        row.onclick = () => {
            if (r.kind === 'folder') openRecentFolder(r.path);
            else openRecentFile(r.path, r.name);
        };
        el.appendChild(row);
    }
}

// 从历史记录直接打开文件夹
async function openRecentFolder(dirPath) {
    try { await loadFolder(dirPath); }
    catch (err) { toast('打开失败: ' + err.message); }
}

// 从历史记录直接打开文件
async function openRecentFile(filePath, name) {
    try {
        const existing = openTabs.find(t => t.absPath === filePath);
        if (existing) { switchToTab(existing.id); return; }
        const content = await fsReadText(filePath);
        addTab(name || basename(filePath), name || basename(filePath), content, filePath);
        addRecent('file', filePath, name || basename(filePath));
    } catch (err) {
        toast('打开失败: ' + err.message);
    }
}

function renderTreeNode(node, container, depth) {
    if (node.type === 'dir') {
        const row = document.createElement('div');
        row.className = 'tree-item';
        row.style.paddingLeft = (8 + depth * 12) + 'px';
        const arrow = document.createElement('span');
        arrow.className = 'tree-arrow ' + (node.expanded ? 'expanded' : 'collapsed');
        row.appendChild(arrow);
        const icon = document.createElement('span');
        icon.className = 'icon';
        icon.textContent = node.expanded ? '\uD83D\uDCC2' : '\uD83D\uDCC1';
        row.appendChild(icon);
        const label = document.createElement('span');
        label.textContent = node.name;
        row.appendChild(label);
        row.onclick = () => { node.expanded = !node.expanded; renderTree(); };
        container.appendChild(row);
        if (node.expanded && node.children) {
            for (const child of node.children) renderTreeNode(child, container, depth + 1);
        }
    } else {
        const row = document.createElement('div');
        row.className = 'tree-item';
        if (activeTabId !== null) {
            const tab = openTabs.find(t => t.id === activeTabId);
            if (tab && tab.path === node.fileRef.path) row.classList.add('selected');
        }
        row.style.paddingLeft = (8 + depth * 12 + 16) + 'px';
        const icon = document.createElement('span');
        icon.className = 'icon';
        icon.textContent = getFileIcon(node.name);
        row.appendChild(icon);
        const label = document.createElement('span');
        label.textContent = node.name;
        row.appendChild(label);
        row.onclick = () => openScannedFile(node.fileRef);
        container.appendChild(row);
    }
}

function getFileIcon(name) {
    const ext = name.split('.').pop().toLowerCase();
    const icons = {
        'py':'\uD83D\uDC0D','js':'\uD83D\uDFE8','ts':'\uD83D\uDD35','jsx':'\u269B','tsx':'\u269B',
        'html':'\uD83C\uDF10','css':'\uD83C\uDFA8','json':'\uD83D\uDCCB','md':'\uD83D\uDCDD',
        'sh':'\uD83D\uDCBB','bash':'\uD83D\uDCBB','go':'\uD83D\uDC39','rs':'\u2699',
        'java':'\u2615','c':'\uD83D\uDD27','cpp':'\uD83D\uDD27','h':'\uD83D\uDD27','hpp':'\uD83D\uDD27'
    };
    return icons[ext] || '\uD83D\uDCC4';
}

// ========== 打开扫描到的文件 ==========
async function openScannedFile(fileRef) {
    const existing = openTabs.find(t => t.path === fileRef.path);
    if (existing) { switchToTab(existing.id); return; }
    let content = '';
    try {
        if (fileRef.absPath) {
            content = await fsReadText(fileRef.absPath);
        }
    } catch (err) {
        content = '// 加载失败: ' + err.message;
    }
    addTab(fileRef.name, fileRef.path, content, fileRef.absPath || null);
}

// ========== 标签管理 ==========
function addTab(name, path, content, absPath) {
    const id = ++tabIdCounter;
    openTabs.push({ id, name, path, content, modified: false, absPath: absPath || null });
    switchToTab(id);
}

function switchToTab(id) {
    if (activeTabId !== null) {
        const oldTab = openTabs.find(t => t.id === activeTabId);
        if (oldTab) oldTab.content = cmEditor.getValue();
    }
    activeTabId = id;
    const tab = openTabs.find(t => t.id === id);
    if (!tab) return;

    document.getElementById('emptyState').style.display = 'none';
    cmEditor.getWrapperElement().style.display = '';
    cmEditor.setOption('readOnly', false);
    cmEditor.setValue(tab.content || '');
    cmEditor.setOption('mode', getMode(tab.name));
    cmEditor.clearHistory();
    clearOccurrences();
    cmEditor.refresh();
    cmEditor.scrollTo(0, 0);
    cmEditor.setCursor(0, 0);

    tab.modified = false;
    renderTabsBar();
    renderTree();
    updateStatus();
    updateFormatButton();
    updateEolLabel();
    // 分栏同步
    if (rightEditor) rightEditor.setValue(tab.content || '');
    if (minimapOn) renderMinimap();
    saveSession();

    // 预览状态跟随文件切换：已开预览则重新渲染，非 md 则关闭
    if (previewVisible) {
        if (isMarkdownFile()) renderMarkdownPreview();
        else togglePreview();
    }
}

function closeTab(id, evt) {
    if (evt) evt.stopPropagation();
    const idx = openTabs.findIndex(t => t.id === id);
    if (idx === -1) return;
    openTabs.splice(idx, 1);
    if (openTabs.length === 0) {
        activeTabId = null;
        cmEditor.getWrapperElement().style.display = 'none';
        document.getElementById('emptyState').style.display = 'flex';
        cmEditor.setValue('');
        document.getElementById('btnFormat').style.display = 'none';
        document.getElementById('btnFormatJson').style.display = 'none';
        document.getElementById('btnPreviewFloat').style.display = 'none';
        if (previewVisible) togglePreview();
        if (rightEditor) toggleSplitView();
        if (minimapOn) toggleMinimap();
        localStorage.removeItem(SESSION_KEY);
    } else if (activeTabId === id) {
        const newIdx = Math.min(idx, openTabs.length - 1);
        switchToTab(openTabs[newIdx].id);
    }
    renderTabsBar();
    renderTree();
    updateStatus();
    updateEolLabel();
    saveSession();
}

function renderTabsBar() {
    const bar = document.getElementById('tabsBar');
    bar.innerHTML = '';
    for (const tab of openTabs) {
        const el = document.createElement('div');
        el.className = 'tab' + (tab.id === activeTabId ? ' active' : '');
        const nameSpan = document.createElement('span');
        nameSpan.className = 'tab-name';
        nameSpan.textContent = tab.name + (tab.modified ? ' \u2022' : '');
        el.appendChild(nameSpan);
        const closeSpan = document.createElement('span');
        closeSpan.className = 'tab-close';
        closeSpan.textContent = '\u2715';
        closeSpan.onclick = (e) => closeTab(tab.id, e);
        el.appendChild(closeSpan);
        el.onclick = () => switchToTab(tab.id);
        bar.appendChild(el);
    }
}

// ========== 状态栏 ==========
function updateStatus() {
    const tab = openTabs.find(t => t.id === activeTabId);
    document.getElementById('stFile').textContent = tab ? (tab.name + (tab.modified ? ' (已修改)' : '')) : '未打开文件';
    document.getElementById('stLang').textContent = tab ? getLanguageLabel(tab.name) : '-';
    updateStatusCursor();
    updateEolLabel();
}

function updateStatusCursor() {
    const cursor = cmEditor.getCursor();
    document.getElementById('stPos').textContent = '行 ' + (cursor.line + 1) + ', 列 ' + (cursor.ch + 1);
}

// ========== 保存 ==========
async function saveCurrentFile() {
    const tab = openTabs.find(t => t.id === activeTabId);
    if (!tab) { toast('没有打开的文件'); return; }
    tab.content = cmEditor.getValue();
    
    // 有路径的文件（从文件夹打开的），直接写回磁盘
    if (tab.absPath) {
        try {
            await fsWriteText(tab.absPath, tab.content);
            tab.modified = false;
            renderTabsBar(); updateStatus();
            toast('已保存');
            return;
        } catch (err) { 
            console.error('保存失败:', err);
            toast('保存失败: ' + err.message);
            return;
        }
    }
    
    // 新建文件（无路径），用保存对话框选择位置
    try {
        const savePath = await dlgSave({ defaultPath: tab.name });
        if (!savePath) return; // 用户取消
        
        await fsWriteText(savePath, tab.content);
        
        tab.absPath = savePath;
        tab.name = basename(savePath);
        tab.path = basename(savePath);
        tab.modified = false;
        
        // 如果保存到当前打开的文件夹内，加入文件树
        if (currentDirPath && savePath.startsWith(currentDirPath + '/')) {
            const relPath = savePath.slice(currentDirPath.length + 1);
            const existingIndex = scannedFiles.findIndex(f => f.path === relPath);
            if (existingIndex === -1) {
                scannedFiles.push({ name: tab.name, path: relPath, absPath: savePath });
                scannedFiles.sort((a, b) => a.path.localeCompare(b.path));
                folderTree = buildTree(scannedFiles, basename(currentDirPath));
            }
        }
        
        renderTabsBar(); 
        renderTree();
        updateStatus();
        addRecent('file', savePath, tab.name);
        toast('已保存到 ' + tab.name);
    } catch (err) {
        console.error('保存失败:', err);
        toast('保存失败: ' + err.message);
    }
}

function downloadCurrentFile() {
    const tab = openTabs.find(t => t.id === activeTabId);
    if (!tab) { toast('没有打开的文件'); return; }
    tab.content = cmEditor.getValue();
    const blob = new Blob([tab.content], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = tab.name; a.click();
    URL.revokeObjectURL(a.href);
    toast('已下载 ' + tab.name);
}

function doNewFile() {
    const name = 'untitled-' + Date.now().toString().slice(-4) + '.txt';
    addTab(name, name, '', null, null);
    renderTree(); // 新建后刷新文件树，显示在"未保存文件"分组
    toast('已新建文件');
}

// ========== 删除文件 ==========
async function deleteCurrentFile() {
    const tab = openTabs.find(t => t.id === activeTabId);
    if (!tab) { toast('没有打开的文件'); return; }
    
    // 确认删除
    if (!confirm('确定要删除文件 "' + tab.name + '" 吗？\n此操作不可恢复。')) {
        return;
    }
    
    // 有路径的文件，从磁盘删除
    if (tab.absPath) {
        try {
            await fsRemove(tab.absPath);
            toast('文件已删除');
        } catch (err) {
            console.error('删除失败:', err);
            toast('删除失败: ' + err.message);
            return;
        }
    } else {
        // 未保存文件，直接关闭标签即可
        toast('已关闭未保存文件');
    }
    
    // 从 scannedFiles 中移除
    const fileIndex = scannedFiles.findIndex(f => f.path === tab.path);
    if (fileIndex !== -1) {
        scannedFiles.splice(fileIndex, 1);
        folderTree = buildTree(scannedFiles, currentDirPath ? basename(currentDirPath) : 'folder');
    }
    
    // 关闭标签
    closeTab(tab.id);
    renderTree();
}

// ========== 刷新文件夹 ==========
async function doRefreshFolder() {
    if (currentDirPath) {
        toast('正在刷新...');
        scannedFiles = [];
        await scanDir(currentDirPath, '');
        scannedFiles.sort((a, b) => a.path.localeCompare(b.path));
        folderTree = buildTree(scannedFiles, basename(currentDirPath));
        renderTree();
        updateActiveTabAbsPath();
        toast('已刷新，共 ' + scannedFiles.length + ' 个文件');
    } else if (folderTree) {
        toast('请重新打开文件夹');
    } else {
        toast('没有打开的文件夹');
    }
}

// 刷新后更新已打开文件的 absPath
function updateActiveTabAbsPath() {
    for (const tab of openTabs) {
        if (tab.absPath && tab.path) {
            const refreshedFile = scannedFiles.find(f => f.path === tab.path);
            if (refreshedFile && refreshedFile.absPath) {
                tab.absPath = refreshedFile.absPath;
            }
        }
    }
}

// ========== SQL 格式化 ==========
function isSQLFile() {
    const tab = openTabs.find(t => t.id === activeTabId);
    return tab && /\.sql$/i.test(tab.name);
}

function updateFormatButton() {
    document.getElementById('btnFormat').style.display = isSQLFile() ? 'block' : 'none';
    document.getElementById('btnFormatJson').style.display = isJsonFile() ? 'block' : 'none';
    // 预览按钮：仅 Markdown 文件显示
    const pvBtn = document.getElementById('btnPreviewFloat');
    pvBtn.style.display = isMarkdownFile() ? 'block' : 'none';
}

function formatSQL() {
    if (!cmEditor || !isSQLFile()) return;
    const btn = document.getElementById('btnFormat');
    try {
        const raw = cmEditor.getValue();
        // 尝试多种方言，找到能成功的
        const dialects = ['mysql', 'mariadb', 'postgresql', 'sql'];
        let formatted = null;
        let lastErr = null;
        for (const lang of dialects) {
            try {
                formatted = sqlFormatter.format(raw, {
                    language: lang,
                    tabWidth: 4,
                    useTabs: false,
                    keywordCase: 'upper',
                    linesBetweenQueries: 2
                });
                break;
            } catch (e) {
                lastErr = e;
            }
        }
        if (formatted === null) {
            // 所有方言都失败，用最宽松的方式：不指定语言参数
            try {
                formatted = sqlFormatter.format(raw, {
                    tabWidth: 4,
                    useTabs: false,
                    keywordCase: 'upper'
                });
            } catch (e2) {
                throw lastErr || e2;
            }
        }
        const cursor = cmEditor.getCursor();
        cmEditor.setValue(formatted);
        const maxLine = cmEditor.lineCount() - 1;
        cmEditor.setCursor(Math.min(cursor.line, maxLine), 0);
        btn.textContent = '\u2713 已格式化';
        btn.classList.add('done');
        setTimeout(() => {
            btn.textContent = '\u270E 格式化 SQL';
            btn.classList.remove('done');
        }, 1500);
        toast('SQL 格式化完成');
    } catch (e) {
        console.error('SQL 格式化失败:', e);
        toast('格式化失败: ' + e.message);
    }
}

// ========== JSON 格式化 ==========
function isJsonFile() {
    const tab = openTabs.find(t => t.id === activeTabId);
    return tab && /\.json$/i.test(tab.name);
}

function formatJSON() {
    if (!cmEditor || !isJsonFile()) return;
    const btn = document.getElementById('btnFormatJson');
    try {
        const raw = cmEditor.getValue();
        const parsed = JSON.parse(raw);  // 解析失败会抛 SyntaxError
        const formatted = JSON.stringify(parsed, null, 4);
        const cursor = cmEditor.getCursor();
        cmEditor.setValue(formatted);
        const maxLine = cmEditor.lineCount() - 1;
        cmEditor.setCursor(Math.min(cursor.line, maxLine), 0);
        btn.textContent = '\u2713 已格式化';
        btn.classList.add('done');
        setTimeout(() => {
            btn.textContent = '\u270E 格式化 JSON';
            btn.classList.remove('done');
        }, 1500);
        toast('JSON 格式化完成');
    } catch (e) {
        console.error('JSON 格式化失败:', e);
        toast('格式化失败: ' + e.message);
    }
}

// ========== 快捷键 ==========
function setupShortcuts() {
    document.addEventListener('keydown', (e) => {
        // 内联后，编辑器视图需激活才接管快捷键（避免与 shell 的 Cmd+1~4 冲突）
        const view = document.getElementById('view-editor');
        if (!view || !view.classList.contains('active')) return;
        // 用 e.code 判断物理按键：macOS 下 Option 组合会改变 e.key（如 Cmd+Alt+M → 'µ'）
        const code = e.code;
        if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveCurrentFile(); }
        if ((e.ctrlKey || e.metaKey) && e.key === 'w') { e.preventDefault(); if (activeTabId !== null) closeTab(activeTabId); }
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') { e.preventDefault(); togglePreview(); }
        // Goto Anything (Ctrl+M)
        if (e.ctrlKey && !e.metaKey && !e.altKey && code === 'KeyM') { e.preventDefault(); showGotoPanel(); }
        // 全局搜索 (Cmd+Shift+F)
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && !e.altKey && code === 'KeyF') { e.preventDefault(); showSearchAllPanel(); }
        // 视图操作
        if ((e.metaKey || e.ctrlKey) && e.altKey && code === 'Digit2') { e.preventDefault(); toggleSplitView(); }
        if ((e.metaKey || e.ctrlKey) && e.altKey && code === 'KeyT') { e.preventDefault(); toggleTheme(); }
        if ((e.metaKey || e.ctrlKey) && e.altKey && code === 'KeyM') { e.preventDefault(); toggleMinimap(); }
        // 宏录制 / 回放
        if (e.metaKey && e.ctrlKey && !e.altKey && code === 'KeyR') { e.preventDefault(); toggleMacro(); }
        if (e.metaKey && e.shiftKey && !e.ctrlKey && !e.altKey && code === 'KeyR') { e.preventDefault(); playMacro(); }
        // Esc 关闭浮层面板
        if (e.key === 'Escape') {
            closeSearchReplacePanel();
            closeGotoPanel();
            closeSearchAllPanel();
        }
    });
}

// ========== 会话恢复 ==========
let sessionTimer = null;
function saveSession() {
    if (sessionTimer) return;
    sessionTimer = setTimeout(() => { sessionTimer = null; saveSessionNow(); }, 200);
}
function saveSessionNow() {
    if (activeTabId === null) return;
    try {
        const tab = openTabs.find(t => t.id === activeTabId);
        const cursor = cmEditor.getCursor();
        const data = {
            tabs: openTabs.map(t => ({
                name: t.name, path: t.path, absPath: t.absPath,
                content: t.content, modified: t.modified
            })),
            activePath: tab ? tab.path : null,
            cursor: { line: cursor.line, ch: cursor.ch },
            theme: lightTheme, split: splitViewActive
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(data));
    } catch (e) {}
}

function restoreSession() {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);
        if (!data || !Array.isArray(data.tabs) || data.tabs.length === 0) return;

        // 重建 tabs（id 重新分配）
        tabIdCounter = 0;
        openTabs = [];
        const pathToId = {};
        for (const t of data.tabs) {
            tabIdCounter++;
            const id = tabIdCounter;
            openTabs.push({ id, name: t.name, path: t.path, absPath: t.absPath || null, content: t.content || '', modified: !!t.modified });
            pathToId[t.path] = id;
        }
        renderTabsBar();
        renderTree();

        // 恢复激活 tab 与光标
        if (data.activePath && pathToId[data.activePath]) {
            switchToTab(pathToId[data.activePath]);
        } else {
            switchToTab(openTabs[0].id);
        }
        if (data.cursor) {
            cmEditor.setCursor({ line: data.cursor.line, ch: data.cursor.ch });
            cmEditor.scrollIntoView({ line: data.cursor.line, ch: data.cursor.ch }, 80);
        }
        if (data.theme) toggleTheme(true);
        if (data.split) toggleSplitView(true);
        showSessionToast(data.tabs.length);
    } catch (e) {
        console.error('恢复会话失败:', e);
    }
}

function showSessionToast(n) {
    const old = document.getElementById('sessionToast');
    if (old) old.remove();
    const el = document.createElement('div');
    el.id = 'sessionToast';
    el.innerHTML = '<span>已恢复上次会话（' + n + ' 个标签页）</span><button onclick="document.getElementById(\'sessionToast\').remove()">知道了</button>';
    document.body.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.remove(); }, 6000);
}

// ========== Goto Anything（Ctrl+M） ==========
const SYMBOL_PATTERNS = [
    /^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/,
    /^\s*(?:export\s+)?class\s+(\w+)/,
    /^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(/,
    /^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?function/,
    /^\s*def\s+(\w+)/,
    /^\s*class\s+(\w+)/,
    /^\s*fn\s+(\w+)/,
    /^\s*(?:pub\s+)?struct\s+(\w+)/,
    /^\s*(?:pub\s+)?enum\s+(\w+)/,
    /^\s*(?:pub\s+)?trait\s+(\w+)/,
    /^\s*(?:pub\s+)?fn\s+(\w+)/,
    /^\s*func\s+(?:\([^)]*\)\s+)?(\w+)/,
    /^\s*type\s+(\w+)/,
    /^\s*(?:public|private|protected)\s+(?:static\s+)?[\w<>\[\],\s*]+\s+(\w+)\s*\(/,
    /^\s*(?:static\s+)?(?:void|int|char|float|double|long|bool|boolean|string|String|auto|const|unsigned|signed|size_t|return)\s+(\w+)\s*\(/
];

// 提取文本中的函数/类/方法符号
function extractFileSymbols(content) {
    const lines = String(content || '').split('\n');
    const symbols = [];
    for (let i = 0; i < lines.length; i++) {
        for (const p of SYMBOL_PATTERNS) {
            const m = lines[i].match(p);
            if (m && m[1]) {
                symbols.push({ name: m[1], line: i + 1 });
                break;
            }
        }
    }
    return symbols;
}

// 找到光标当前所在的最内层函数名（供 Ctrl+M 默认填充 @函数名）
function getEnclosingFunctionName() {
    const tab = openTabs.find(t => t.id === activeTabId);
    if (!tab) return null;
    const content = tab.content || cmEditor.getValue();
    const lines = content.split('\n');
    const cursorLine = cmEditor.getCursor().line;

    const candidates = extractFileSymbols(content)
        .filter(s => s.line - 1 <= cursorLine)
        .sort((a, b) => b.line - a.line);

    for (const s of candidates) {
        // 用大括号深度判断该函数是否在光标前已闭合
        let depth = 0;
        let closed = false;
        for (let i = s.line - 1; i <= cursorLine; i++) {
            const l = lines[i] || '';
            for (const ch of l) {
                if (ch === '{') depth++;
                else if (ch === '}') { depth--; if (depth < 0) { closed = true; break; } }
            }
            if (closed) break;
        }
        // Python 等无大括号语言：直接取最近的符号定义行
        if (depth === 0 && lines[s.line - 1].includes('def')) return s.name;
        if (!closed) return s.name;
    }
    return null;
}

let gotoPanel = null;
function showGotoPanel() {
    closeGotoPanel();
    if (!activeTabId) return;

    // 汇总候选：当前文件夹文件 + 最近文件 + 打开标签
    const items = [];
    const seen = new Set();
    const push = (name, path, absPath, kind) => {
        const key = kind + '|' + path;
        if (seen.has(key)) return;
        seen.add(key);
        items.push({ name, path, absPath: absPath || null, kind });
    };
    for (const f of scannedFiles) push(f.name, f.path, f.absPath, 'file');
    for (const r of recents) {
        if (r.kind === 'file') push(r.name, r.path, r.path, 'file');
        else push(r.name, r.path, null, 'folder');
    }
    for (const t of openTabs) if (t.absPath) push(t.name, t.path, t.absPath, 'file');

    gotoPanel = document.createElement('div');
    gotoPanel.id = 'gotoPanel';
    gotoPanel.className = 'float-panel';
    gotoPanel.innerHTML = `
        <input type="text" id="gotoInput" placeholder="输入文件名跳转 · @ 函数/符号 · :行号">
        <div class="fp-list" id="gotoList"></div>
        <div class="fp-hint">@ 跳转当前文件符号 · : 跳转行号 · ↑↓ 选择 · Enter 确认 · Esc 关闭</div>
    `;
    document.body.appendChild(gotoPanel);

    let filtered = [];
    let activeIdx = 0;

    // 提取当前文件内的函数/类/方法符号
    function currentFileSymbols() {
        const tab = openTabs.find(t => t.id === activeTabId);
        if (!tab) return [];
        return extractFileSymbols(tab.content || cmEditor.getValue());
    }

    function match(q) {
        if (!q) return items.slice(0, 50);
        // @前缀：当前文件符号跳转
        if (q.startsWith('@')) {
            const lq = q.slice(1).toLowerCase();
            if (!lq) return [];
            const syms = currentFileSymbols();
            return syms.filter(s => s.name.toLowerCase().includes(lq))
                .map(s => ({ kind: 'symbol', name: s.name, line: s.line, path: '' }))
                .slice(0, 100);
        }
        // :前缀：行号跳转
        if (q.startsWith(':')) {
            const n = parseInt(q.slice(1), 10);
            if (!isNaN(n) && n > 0) {
                return [{ kind: 'line', name: '跳转到第 ' + n + ' 行', line: n, path: '' }];
            }
            return [];
        }
        const lq = q.toLowerCase();
        const starts = [], contains = [];
        for (const it of items) {
            const n = it.name.toLowerCase(), p = it.path.toLowerCase();
            if (n.startsWith(lq) || p.startsWith(lq)) starts.push(it);
            else if (n.includes(lq) || p.includes(lq)) contains.push(it);
        }
        return starts.concat(contains).slice(0, 100);
    }

    function render() {
        const list = document.getElementById('gotoList');
        list.innerHTML = '';
        filtered = match(document.getElementById('gotoInput').value);
        if (filtered.length === 0) {
            list.innerHTML = '<div class="fp-empty">无匹配</div>';
            return;
        }
        for (let i = 0; i < filtered.length; i++) {
            const it = filtered[i];
            const row = document.createElement('div');
            row.className = 'fp-item' + (i === activeIdx ? ' active' : '');
            if (it.kind === 'symbol') {
                row.innerHTML = '<span class="fp-icon">ƒ</span><span>' + escapeHtml(it.name) + '</span><span class="fp-line">:' + it.line + '</span>';
            } else if (it.kind === 'line') {
                row.innerHTML = '<span class="fp-icon">↧</span><span>' + escapeHtml(it.name) + '</span>';
            } else {
                row.innerHTML = '<span class="fp-icon">' + (it.kind === 'folder' ? '\uD83D\uDCC1' : getFileIcon(it.name)) + '</span><span>' + escapeHtml(it.name) + '</span><span class="fp-path">' + escapeHtml(it.path) + '</span>';
            }
            row.onclick = () => openGotoItem(it);
            // 悬停只切换 active 类，不重建 DOM（重建会让 click 落空）
            row.onmousemove = () => {
                if (activeIdx === i) return;
                activeIdx = i;
                list.querySelectorAll('.fp-item').forEach((el, idx) => el.classList.toggle('active', idx === activeIdx));
            };
            list.appendChild(row);
        }
        const active = list.querySelector('.active');
        if (active) active.scrollIntoView({ block: 'nearest' });
    }

    function updateActiveClass() {
        const list = document.getElementById('gotoList');
        list.querySelectorAll('.fp-item').forEach((el, idx) => el.classList.toggle('active', idx === activeIdx));
        const active = list.querySelector('.active');
        if (active) active.scrollIntoView({ block: 'nearest' });
    }

    function openGotoItem(it) {
        closeGotoPanel();
        if (it.kind === 'symbol' || it.kind === 'line') {
            const line = Math.max(0, Math.min((it.line || 1) - 1, cmEditor.lineCount() - 1));
            cmEditor.setCursor({ line, ch: 0 });
            cmEditor.scrollIntoView({ line, ch: 0 }, 60);
            cmEditor.refresh();
            cmEditor.focus();
            return;
        }
        if (it.kind === 'folder') { openRecentFolder(it.absPath || it.path); return; }
        if (it.absPath) {
            const existing = openTabs.find(t => t.absPath === it.absPath);
            if (existing) { switchToTab(existing.id); return; }
            openScannedFile({ name: it.name, path: it.path, absPath: it.absPath });
        } else {
            openRecentFile(it.path, it.name);
        }
    }

    const input = document.getElementById('gotoInput');
    input.addEventListener('input', () => { activeIdx = 0; render(); });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            if (filtered.length === 0) return;
            const dir = e.key === 'ArrowDown' ? 1 : -1;
            activeIdx = Math.min(Math.max(activeIdx + dir, 0), filtered.length - 1);
            updateActiveClass();
        }
        else if (e.key === 'Enter') { e.preventDefault(); if (filtered[activeIdx]) openGotoItem(filtered[activeIdx]); }
        else if (e.key === 'Escape') { closeGotoPanel(); }
    });

    // 光标在函数内时，默认填充 @函数名，直接进入函数跳转模式
    const enclosingFn = getEnclosingFunctionName();
    input.focus(); // 先聚焦，setSelectionRange 才可靠
    if (enclosingFn) {
        input.value = '@' + enclosingFn;
        input.setSelectionRange(1, input.value.length); // 选中函数名，便于直接输入替换
    }
    render();
}

function closeGotoPanel() {
    if (gotoPanel) { gotoPanel.remove(); gotoPanel = null; }
}

// ========== 全局搜索（Cmd+Shift+F） ==========
let searchAllPanel = null;
function showSearchAllPanel() {
    closeSearchAllPanel();
    if (!currentDirPath && scannedFiles.length === 0) {
        toast('请先打开文件夹');
        return;
    }
    searchAllPanel = document.createElement('div');
    searchAllPanel.id = 'searchAllPanel';
    searchAllPanel.className = 'float-panel';
    searchAllPanel.innerHTML = `
        <input type="text" id="searchAllInput" placeholder="在文件夹中搜索（Cmd+Shift+F）...">
        <div class="fp-list" id="searchAllList"><div class="fp-empty">输入关键词开始搜索</div></div>
    `;
    document.body.appendChild(searchAllPanel);

    const input = document.getElementById('searchAllInput');
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); runGlobalSearch(input.value); }
        else if (e.key === 'Escape') { closeSearchAllPanel(); }
    });
    input.focus();
}

function closeSearchAllPanel() {
    if (searchAllPanel) { searchAllPanel.remove(); searchAllPanel = null; }
}

async function runGlobalSearch(term) {
    term = (term || '').trim();
    if (!term) return;
    const list = document.getElementById('searchAllList');
    list.innerHTML = '<div class="fp-empty">搜索中...</div>';
    const lterm = term.toLowerCase();
    const results = [];
    const maxResults = 200;
    for (const f of scannedFiles) {
        let content = '';
        try { content = await fsReadText(f.absPath); } catch (e) { continue; }
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const idx = lines[i].toLowerCase().indexOf(lterm);
            if (idx >= 0) {
                results.push({ name: f.name, path: f.path, absPath: f.absPath, line: i + 1, snippet: lines[i], idx });
                if (results.length >= maxResults) break;
            }
        }
        if (results.length >= maxResults) break;
        // 让出事件循环，避免卡 UI
        await new Promise(r => setTimeout(r, 0));
    }

    list.innerHTML = '';
    if (results.length === 0) {
        list.innerHTML = '<div class="fp-empty">未找到匹配</div>';
        return;
    }
    for (const r of results) {
        const row = document.createElement('div');
        row.className = 'fp-item';
        row.innerHTML = '<span class="fp-icon">' + getFileIcon(r.name) + '</span>' +
            '<span class="fp-snippet">' + escapeHtml(r.snippet) + '</span>' +
            '<span class="fp-line">' + r.line + '</span>';
        row.onclick = () => {
            closeSearchAllPanel();
            openSearchResult(r);
        };
        list.appendChild(row);
    }
}

async function openSearchResult(r) {
    const existing = openTabs.find(t => t.absPath === r.absPath);
    if (existing) {
        switchToTab(existing.id);
        cmEditor.setCursor({ line: r.line - 1, ch: 0 });
        cmEditor.scrollIntoView({ line: r.line - 1, ch: 0 }, 80);
    } else {
        let content = '';
        try { content = await fsReadText(r.absPath); } catch (e) { content = ''; }
        addTab(r.name, r.path, content, r.absPath);
        cmEditor.setCursor({ line: r.line - 1, ch: 0 });
        cmEditor.scrollIntoView({ line: r.line - 1, ch: 0 }, 80);
    }
}

// ========== 选中变量全文标识 ==========
let occMarks = [];
let occTimer = null;
function clearOccurrences() {
    occMarks.forEach(m => m.clear());
    occMarks = [];
}

function scheduleOccurrenceHighlight(cm) {
    if (occTimer) clearTimeout(occTimer);
    occTimer = setTimeout(() => {
        occTimer = null;
        highlightOccurrences(cm);
    }, 220);
}

function highlightOccurrences(cm) {
    if (!cm || cm !== cmEditor) return;
    clearOccurrences();

    // 多选状态下不做全文标识（避免与 Cmd+D 干扰）
    if (cm.listSelections().length > 1) return;
    // 超大文件跳过，避免卡顿
    const content = cm.getValue();
    if (content.length > 200000) return;

    let word = null;
    let ignoreFrom = null;
    const sel = cm.getSelection();
    if (sel) {
        if (sel.length > 40 || sel.includes('\n')) return;
        word = sel;
        ignoreFrom = cm.getCursor('from');
    } else {
        // 光标停在词上（Sublime 行为）
        const w = cm.findWordAt(cm.getCursor());
        const wtext = cm.getRange(w.anchor, w.head);
        if (!wtext || !/^[\w$]+$/.test(wtext) || wtext.length < 2) return;
        word = wtext;
        ignoreFrom = w.anchor;
    }

    const cursor = cm.getSearchCursor(word, null, { caseFold: false });
    let count = 0;
    while (cursor.findNext()) {
        const f = cursor.from();
        if (ignoreFrom && f.line === ignoreFrom.line && f.ch === ignoreFrom.ch) continue;
        occMarks.push(cm.markText(f, cursor.to(), { className: 'cm-occurrence-highlight' }));
        if (++count >= 300) break;
    }
}

// ========== 多光标 / 多选 ==========
function selectNextOccurrence(cm) {
    const sel = cm.getSelection();
    if (!sel) {
        const word = cm.findWordAt(cm.getCursor());
        cm.setSelection(word.anchor, word.head);
        return;
    }
    const cursor = cm.getSearchCursor(sel, cm.getCursor('head'), { caseFold: false });
    if (cursor.findNext()) {
        cm.addSelection(cursor.from(), cursor.to());
        cm.scrollIntoView(cursor.from(), 60);
    } else {
        toast('没有更多匹配');
    }
}

function selectAllOccurrences(cm) {
    const sel = cm.getSelection();
    if (!sel) return;
    const cursor = cm.getSearchCursor(sel, null, { caseFold: false });
    const ranges = [];
    while (cursor.findNext()) ranges.push([cursor.from(), cursor.to()]);
    if (ranges.length > 0) {
        cm.setSelections(ranges.map(r => ({ anchor: r[0], head: r[1] })));
    }
}

// ========== 行操作 ==========
function moveLine(cm, dir) {
    const from = cm.getCursor('from'), to = cm.getCursor('to');
    if (from.line !== to.line) return;
    const line = from.line, target = line + dir;
    if (target < 0 || target >= cm.lineCount()) return;
    const text = cm.getLine(line);
    const anchor = from.ch, head = to.ch;
    cm.replaceRange('', { line, ch: 0 }, { line: line + 1, ch: 0 });
    cm.replaceRange(text + '\n', { line: target, ch: 0 }, { line: target, ch: 0 });
    cm.setSelection({ line: target, ch: anchor }, { line: target, ch: head });
    cm.scrollIntoView({ line: target, ch: 0 }, 60);
}

function duplicateLine(cm) {
    const from = cm.getCursor('from'), to = cm.getCursor('to');
    const line = from.line;
    const text = cm.getLine(line);
    cm.replaceRange(text + '\n', { line, ch: 0 }, { line, ch: 0 });
    cm.setSelection({ line: line + 1, ch: from.ch }, { line: line + 1, ch: to.ch });
}

function deleteLine(cm) {
    const line = cm.getCursor().line;
    const last = cm.lineCount() - 1;
    const from = { line, ch: 0 };
    const to = line === last ? { line, ch: cm.getLine(line).length } : { line: line + 1, ch: 0 };
    cm.replaceRange('', from, to);
    cm.setCursor({ line: Math.min(line, cm.lineCount() - 1), ch: 0 });
}

// ========== 代码补全 ==========
const HINT_KEYWORDS = {
    'py': ['def', 'class', 'import', 'from', 'return', 'if', 'elif', 'else', 'for', 'while', 'with', 'as', 'try', 'except', 'finally', 'lambda', 'None', 'True', 'False', 'self', 'print'],
    'js': ['function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'continue', 'new', 'this', 'typeof', 'import', 'export', 'async', 'await', 'null', 'undefined', 'true', 'false'],
    'ts': ['interface', 'type', 'enum', 'function', 'const', 'let', 'return', 'import', 'export', 'class', 'extends', 'implements', 'public', 'private', 'readonly', 'async', 'await'],
    'go': ['func', 'package', 'import', 'var', 'const', 'type', 'struct', 'interface', 'return', 'if', 'else', 'for', 'range', 'switch', 'case', 'default', 'go', 'defer', 'nil', 'true', 'false'],
    'rs': ['fn', 'let', 'mut', 'pub', 'struct', 'enum', 'impl', 'trait', 'use', 'mod', 'match', 'if', 'else', 'for', 'while', 'loop', 'return', 'self', 'Self', 'Some', 'None', 'Ok', 'Err', 'String', 'Vec'],
    'c': ['int', 'float', 'double', 'char', 'void', 'struct', 'union', 'enum', 'typedef', 'static', 'extern', 'const', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'sizeof', 'NULL'],
    'sh': ['if', 'then', 'else', 'elif', 'fi', 'for', 'while', 'do', 'done', 'case', 'esac', 'function', 'return', 'local', 'export', 'echo', 'exit', 'true', 'false'],
    'sql': ['SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'INDEX', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'AND', 'OR', 'NOT', 'NULL'],
    'md': ['![', '](', '# ', '## ', '### ', '- ', '* ', '```', '> ', '---']
};
function smartHint(cm) {
    const tab = openTabs.find(t => t.id === activeTabId);
    const ext = tab ? (tab.name.split('.').pop() || '').toLowerCase() : '';
    const base = CodeMirror.hint.anyword(cm) || { list: [], from: cm.getCursor(), to: cm.getCursor() };
    const kw = HINT_KEYWORDS[ext] || [];
    const list = base.list.concat(kw.filter(k => !base.list.includes(k)));
    return { list: list.slice(0, 80), from: base.from, to: base.to };
}

// ========== 分栏视图（同文件对照） ==========
function toggleSplitView(force) {
    if (rightEditor) {
        // 关闭分栏
        const pane = document.getElementById('editorPaneRight');
        if (pane) pane.remove();
        rightEditor = null;
        document.getElementById('editorArea').classList.remove('split-active');
        splitViewActive = false;
        cmEditor.refresh();
        saveSession();
        return;
    }
    if (activeTabId === null) return;
    const area = document.getElementById('editorArea');
    const pane = document.createElement('div');
    pane.className = 'editor-pane split-right';
    pane.id = 'editorPaneRight';
    area.appendChild(pane);
    rightEditor = CodeMirror(pane, {
        value: cmEditor.getValue(),
        theme: 'monokai',
        lineNumbers: true,
        readOnly: true,
        lineWrapping: true,
        tabSize: 4, indentUnit: 4,
        matchBrackets: true,
        foldGutter: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
        foldOptions: { minFoldSize: 2 }
    });
    area.classList.add('split-active');
    splitViewActive = true;
    if (lightTheme) rightEditor.setOption('theme', 'default');
    setTimeout(() => rightEditor.refresh(), 10);
    saveSession();
}

// ========== Minimap ==========
function toggleMinimap() {
    minimapOn = !minimapOn;
    const pane = document.getElementById('editorPane');
    const mm = document.getElementById('minimap');
    if (pane) pane.classList.toggle('minimap-on', minimapOn);
    if (mm) mm.classList.toggle('visible', minimapOn);
    if (minimapOn) {
        // 延迟一帧，确保 visible 生效后 clientHeight 有效
        setTimeout(() => { renderMinimap(); cmEditor.refresh(); }, 30);
    } else {
        saveSession();
    }
}

let mmTimer = null;
function scheduleMinimapRender() {
    if (!minimapOn) return;
    if (mmTimer) clearTimeout(mmTimer);
    mmTimer = setTimeout(renderMinimap, 120);
}

function renderMinimap() {
    const mm = document.getElementById('minimap');
    if (!mm || !minimapOn) return;
    const canvas = mm.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    let h = mm.clientHeight;
    if (h <= 0) {
        // 兜底：用编辑器面板高度
        const pane = document.getElementById('editorPane');
        h = pane ? pane.clientHeight : 400;
    }
    if (h <= 0) return;
    canvas.width = 60;
    canvas.height = h;
    const lines = cmEditor.getValue().split('\n');
    ctx.fillStyle = lightTheme ? '#f0f0f0' : '#3d3d3d';
    ctx.fillRect(0, 0, canvas.width, h);
    if (lines.length === 0) return;
    const lh = Math.max(1, h / lines.length);
    ctx.fillStyle = lightTheme ? '#b0b0b0' : '#8a8a8a';
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().length) {
            ctx.fillRect(1, i * lh, canvas.width - 2, Math.max(1, lh - 0.5));
        }
    }
    // 视口指示条
    const info = cmEditor.getScrollInfo();
    const vp = mm.querySelector('.minimap-viewport');
    const viewH = info.clientHeight / info.height * h;
    const viewTop = info.top / info.height * h;
    vp.style.top = viewTop + 'px';
    vp.style.height = Math.max(6, viewH) + 'px';
}

// ========== 主题切换 ==========
function toggleTheme(force) {
    lightTheme = typeof force === 'boolean' ? force : !lightTheme;
    const view = document.getElementById('view-editor');
    if (view) view.classList.toggle('light-theme', lightTheme);
    cmEditor.setOption('theme', lightTheme ? 'default' : 'monokai');
    if (rightEditor) rightEditor.setOption('theme', lightTheme ? 'default' : 'monokai');
    if (minimapOn) renderMinimap();
    if (typeof force !== 'boolean') toast(lightTheme ? '已切换亮色主题' : '已切换暗色主题');
    saveSession();
}

// ========== 换行符切换 ==========
function toggleEol() {
    const tab = openTabs.find(t => t.id === activeTabId);
    if (!tab) return;
    const content = cmEditor.getValue();
    const isCRLF = content.includes('\r\n');
    const next = isCRLF ? content.replace(/\r\n/g, '\n') : content.replace(/\n/g, '\r\n');
    cmEditor.setValue(next);
    tab.content = next;
    tab.modified = true;
    renderTabsBar(); updateStatus(); saveSession();
    toast('已切换为 ' + (isCRLF ? 'LF' : 'CRLF'));
}

function updateEolLabel() {
    const el = document.getElementById('stEol');
    if (!el) return;
    const content = activeTabId !== null ? cmEditor.getValue() : '';
    el.textContent = content.includes('\r\n') ? 'CRLF' : 'LF';
}

// ========== 宏录制 / 回放 ==========
function toggleMacro() {
    if (macroRecording) {
        macroRecording = false;
        toast('已停止录制（' + macroSteps.length + ' 步，Cmd+Shift+R 回放）');
    } else {
        macroSteps = [];
        macroRecording = true;
        toast('开始录制... Cmd+Ctrl+R 停止');
    }
}

function playMacro() {
    macroRecording = false;
    if (macroSteps.length === 0) { toast('没有录制的宏'); return; }
    for (const s of macroSteps) {
        cmEditor.replaceRange(s.text, s.from, s.to, s.origin);
    }
    toast('已回放 ' + macroSteps.length + ' 步');
}

// ========== 工具 ==========
function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ========== 自定义查找替换面板 ==========
let searchPanelVisible = false;
let searchCursor = null;
let currentSearchTerm = '';

function showSearchReplacePanel(cm, showReplace = true) {
    // 移除已存在的面板
    closeSearchReplacePanel();

    const panel = document.createElement('div');
    panel.id = 'searchReplacePanel';
    panel.innerHTML = `
        <button class="close-btn" onclick="closeSearchReplacePanel()">×</button>
        <div class="row">
            <label>查找</label>
            <input type="text" id="searchInput" placeholder="输入查找内容...">
            <span class="counter" id="searchCounter"></span>
        </div>
        <div class="row" id="replaceRow" style="${showReplace ? '' : 'display:none'}">
            <label>替换</label>
            <input type="text" id="replaceInput" placeholder="输入替换内容...">
        </div>
        <div class="btn-group">
            <button onclick="doSearchNext()">下一个</button>
            <button onclick="doSearchPrev()">上一个</button>
            ${showReplace ? '<button onclick="doReplace()">替换</button><button class="primary" onclick="doReplaceAll()">全部替换</button>' : ''}
        </div>
    `;
    document.body.appendChild(panel);
    searchPanelVisible = true;

    // 聚焦查找输入框
    const searchInput = document.getElementById('searchInput');
    searchInput.focus();

    // 实时查找
    searchInput.addEventListener('input', () => {
        currentSearchTerm = searchInput.value;
        if (currentSearchTerm) {
            highlightAllMatches(cm, currentSearchTerm);
        } else {
            cm.getAllMarks().forEach(m => m.clear());
            updateCounter(0);
        }
    });

    // Enter 键查找下一个
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (e.shiftKey) {
                doSearchPrev();
            } else {
                doSearchNext();
            }
        }
    });

    const replaceInput = document.getElementById('replaceInput');
    if (replaceInput) {
        replaceInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                doReplace();
            }
        });
    }
}

function closeSearchReplacePanel() {
    const panel = document.getElementById('searchReplacePanel');
    if (panel) {
        panel.remove();
        searchPanelVisible = false;
    }
    // 清除高亮
    if (cmEditor) {
        cmEditor.getAllMarks().forEach(m => m.clear());
    }
}

function highlightAllMatches(cm, term) {
    cm.getAllMarks().forEach(m => m.clear());
    if (!term) return 0;

    const cursor = cm.getSearchCursor(term, null, { caseFold: true });
    let count = 0;
    while (cursor.findNext()) {
        count++;
        cm.markText(cursor.from(), cursor.to(), {
            className: 'cm-search-highlight',
            clearOnEnter: false
        });
    }
    updateCounter(count);
    return count;
}

function updateCounter(count) {
    const counter = document.getElementById('searchCounter');
    if (counter) {
        counter.textContent = count > 0 ? `${count} 个匹配` : '';
    }
}

function doSearchNext() {
    const term = document.getElementById('searchInput')?.value;
    if (!term || !cmEditor) return;

    const cursor = cmEditor.getSearchCursor(term, cmEditor.getCursor(), { caseFold: true });
    if (cursor.findNext()) {
        cmEditor.setSelection(cursor.from(), cursor.to());
        cmEditor.scrollIntoView(cursor.from(), 100);
    } else {
        // 从头开始查找
        const cursor2 = cmEditor.getSearchCursor(term, { line: 0, ch: 0 }, { caseFold: true });
        if (cursor2.findNext()) {
            cmEditor.setSelection(cursor2.from(), cursor2.to());
            cmEditor.scrollIntoView(cursor2.from(), 100);
        }
    }
}

function doSearchPrev() {
    const term = document.getElementById('searchInput')?.value;
    if (!term || !cmEditor) return;

    const cursor = cmEditor.getSearchCursor(term, cmEditor.getCursor(), { caseFold: true });
    if (cursor.findPrevious()) {
        cmEditor.setSelection(cursor.from(), cursor.to());
        cmEditor.scrollIntoView(cursor.from(), 100);
    } else {
        // 从末尾开始查找
        const lastLine = cmEditor.lastLine();
        const cursor2 = cmEditor.getSearchCursor(term, { line: lastLine, ch: cmEditor.getLine(lastLine).length }, { caseFold: true });
        if (cursor2.findPrevious()) {
            cmEditor.setSelection(cursor2.from(), cursor2.to());
            cmEditor.scrollIntoView(cursor2.from(), 100);
        }
    }
}

function doReplace() {
    const term = document.getElementById('searchInput')?.value;
    const replacement = document.getElementById('replaceInput')?.value || '';
    if (!term || !cmEditor) return;

    const cursor = cmEditor.getSearchCursor(term, cmEditor.getCursor(), { caseFold: true });
    if (cursor.findNext()) {
        cmEditor.replaceRange(replacement, cursor.from(), cursor.to());
        cmEditor.setCursor(cursor.to());
        doSearchNext();
    }
}

function doReplaceAll() {
    const term = document.getElementById('searchInput')?.value;
    const replacement = document.getElementById('replaceInput')?.value || '';
    if (!term || !cmEditor) return;

    const cursor = cmEditor.getSearchCursor(term, null, { caseFold: true });
    let count = 0;
    while (cursor.findNext()) {
        cmEditor.replaceRange(replacement, cursor.from(), cursor.to());
        count++;
    }

    toast(`已替换 ${count} 处`);
    closeSearchReplacePanel();
}

// ========== 侧边栏拖拽 ==========
function setupResizer() {
    const resizer = document.getElementById('resizer');
    const sidebar = document.getElementById('sidebar');
    let dragging = false, startX, startW;
    resizer.addEventListener('mousedown', (e) => {
        dragging = true; startX = e.clientX; startW = sidebar.offsetWidth;
        resizer.classList.add('dragging');
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    });
    function onMove(e) {
        if (!dragging) return;
        const w = startW + e.clientX - startX;
        if (w >= 140 && w <= 500) sidebar.style.width = w + 'px';
    }
    function onUp() {
        dragging = false; resizer.classList.remove('dragging');
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        cmEditor.refresh();
    }
}

// ========== 通知 ==========
function toast(msg) {
    const old = document.querySelector('.toast');
    if (old) old.remove();
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 2000);
}

// ========== 启动 ==========
init();
