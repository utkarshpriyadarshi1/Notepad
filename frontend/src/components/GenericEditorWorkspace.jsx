import { useState, useMemo, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPen,
    faEye,
    faColumns,
    faArrowDown,
    faXmark,
    faUndo,
    faRedo,
    faCut,
    faCopy,
    faPaste,
    faBold,
    faItalic,
    faStrikethrough,
    faCode,
    faListUl,
    faListOl,
    faListCheck,
    faQuoteLeft,
    faLink,
    faImage,
    faTerminal,
    faTable,
    faMinus,
    faSearch,
    faCheck,
    faTriangleExclamation,
    faFloppyDisk,
    faMagnifyingGlassPlus,
    faMagnifyingGlassMinus,
    faHighlighter
} from '@fortawesome/free-solid-svg-icons';
import { marked } from 'marked';

// Custom lightweight lexical syntax highlighter with bracket pair colorization for preview rendering
const highlightCode = (code, lang) => {
    if (!code) return '';
    const l = (lang || '').toLowerCase();
    
    let result = '';
    let bracketDepth = 0;
    
    // Bracket depth classes defined in index.css
    const bracketColors = [
        'bracket-depth-0',
        'bracket-depth-1',
        'bracket-depth-2',
        'bracket-depth-3'
    ];
    
    let i = 0;
    const len = code.length;
    
    const escapeHtml = (text) => {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };
    
    // Keywords for different formats
    const jsKeywords = new Set(['const', 'let', 'var', 'function', 'return', 'import', 'export', 'class', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'default', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'typeof', 'instanceof', 'extends', 'super', 'async', 'await', 'yield', 'package', 'public', 'private', 'protected', 'static', 'final', 'interface', 'implements', 'void']);
    const javaKeywords = new Set(['public', 'private', 'protected', 'static', 'final', 'class', 'interface', 'extends', 'implements', 'new', 'this', 'super', 'package', 'import', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'default', 'try', 'catch', 'finally', 'throw', 'throws', 'void', 'int', 'double', 'float', 'long', 'short', 'byte', 'char', 'boolean', 'synchronized', 'volatile', 'transient', 'native', 'strictfp']);
    const sqlKeywords = new Set(['select', 'from', 'where', 'insert', 'into', 'values', 'update', 'set', 'delete', 'create', 'table', 'drop', 'alter', 'index', 'join', 'inner', 'left', 'right', 'on', 'and', 'or', 'not', 'in', 'like', 'is', 'null', 'order', 'by', 'limit', 'group', 'having', 'count', 'sum', 'avg', 'min', 'max', 'distinct', 'as', 'union', 'all', 'primary', 'key', 'foreign', 'references', 'default', 'returning', 'with', 'recursive', 'offset']);
    
    const keywords = (l === 'java') ? javaKeywords : (l === 'sql') ? sqlKeywords : (['js', 'jsx', 'ts', 'tsx', 'javascript', 'typescript', 'properties'].includes(l)) ? jsKeywords : new Set();
    
    while (i < len) {
        const char = code[i];
        
        // Single line comment //
        if (char === '/' && code[i+1] === '/') {
            let comment = '';
            while (i < len && code[i] !== '\n') {
                comment += code[i++];
            }
            result += `<span class="text-slate-500 dark:text-slate-450 italic">${escapeHtml(comment)}</span>`;
            continue;
        }
        
        // Multi-line comment /* */
        if (char === '/' && code[i+1] === '*') {
            let comment = '/*';
            i += 2;
            while (i < len) {
                if (code[i] === '*' && code[i+1] === '/') {
                    comment += '*/';
                    i += 2;
                    break;
                }
                comment += code[i++];
            }
            result += `<span class="text-slate-500 dark:text-slate-455 italic">${escapeHtml(comment)}</span>`;
            continue;
        }
        
        // Properties/YAML comment '#'
        if ((l === 'yml' || l === 'yaml' || l === 'properties') && char === '#') {
            let comment = '';
            while (i < len && code[i] !== '\n') {
                comment += code[i++];
            }
            result += `<span class="text-slate-500 dark:text-slate-455 italic">${escapeHtml(comment)}</span>`;
            continue;
        }
        
        // SQL comment '--'
        if (l === 'sql' && char === '-' && code[i+1] === '-') {
            let comment = '';
            while (i < len && code[i] !== '\n') {
                comment += code[i++];
            }
            result += `<span class="text-slate-500 dark:text-slate-455 italic">${escapeHtml(comment)}</span>`;
            continue;
        }
        
        // Strings
        if (char === '"' || char === "'" || (char === '`' && ['js', 'jsx', 'ts', 'tsx', 'javascript', 'typescript'].includes(l))) {
            const quote = char;
            let str = quote;
            i++;
            while (i < len) {
                const nextChar = code[i];
                if (nextChar === '\\') {
                    str += nextChar + (code[i+1] || '');
                    i += 2;
                } else if (nextChar === quote) {
                    str += quote;
                    i++;
                    break;
                } else {
                    str += nextChar;
                    i++;
                }
            }
            result += `<span class="text-emerald-600 dark:text-emerald-450">${escapeHtml(str)}</span>`;
            continue;
        }
        
        // HTML / XML / JSX / TSX tags
        if ((l === 'html' || l === 'xml' || l === 'jsx' || l === 'tsx') && char === '<') {
            const remaining = code.substring(i);
            const tagMatch = remaining.match(/^<\/?[a-zA-Z0-9\-:]+(\s+[a-zA-Z0-9\-:]+(=("[^"]*"|'[^']*'|[^\s>]+))?)*\s*\/?>/);
            if (tagMatch) {
                const tagContent = tagMatch[0];
                i += tagContent.length;
                
                let highlightedTag = tagContent
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/^(&lt;\/?[a-zA-Z0-9\-:]+)/, '<span class="text-purple-500 dark:text-purple-400 font-semibold">$1</span>')
                    .replace(/(\s[a-zA-Z0-9\-:]+=)/g, '<span class="text-sky-400 dark:text-sky-300 font-semibold">$1</span>')
                    .replace(/(=)(&quot;.*?&quot;|&#39;.*?&#39;|[^\s&gt;]+)/g, '$1<span class="text-emerald-600 dark:text-emerald-400">$2</span>')
                    .replace(/(&gt;)$/, '<span class="text-purple-500 dark:text-purple-400 font-semibold">$1</span>');
                
                result += highlightedTag;
                continue;
            }
        }
        
        // Bracket Pair Colorization (depths 0-3)
        if (char === '(' || char === '[' || char === '{') {
            const colorClass = bracketColors[bracketDepth % bracketColors.length];
            result += `<span class="${colorClass}">${escapeHtml(char)}</span>`;
            bracketDepth++;
            i++;
            continue;
        }
        
        if (char === ')' || char === ']' || char === '}') {
            bracketDepth = Math.max(0, bracketDepth - 1);
            const colorClass = bracketColors[bracketDepth % bracketColors.length];
            result += `<span class="${colorClass}">${escapeHtml(char)}</span>`;
            i++;
            continue;
        }
        
        // Key-Value separators in YAML
        if ((l === 'yml' || l === 'yaml') && char === ':' && code[i+1] === ' ') {
            result += `<span class="text-sky-400 dark:text-sky-300 font-bold">:</span> `;
            i += 2;
            let val = '';
            while (i < len && code[i] !== '\n') {
                val += code[i++];
            }
            result += `<span class="text-emerald-650 dark:text-emerald-450">${escapeHtml(val)}</span>`;
            continue;
        }
        
        // Identifiers / Keywords / Numbers
        if (/[a-zA-Z_$]/.test(char)) {
            let identifier = '';
            while (i < len && /[a-zA-Z0-9_$]/.test(code[i])) {
                identifier += code[i++];
            }
            const lowerId = identifier.toLowerCase();
            if (keywords.has(lowerId)) {
                result += `<span class="text-purple-500 dark:text-purple-400 font-semibold">${escapeHtml(identifier)}</span>`;
            } else if (l === 'properties' && i < len && code[i] === '=') {
                result += `<span class="text-sky-400 dark:text-sky-300 font-bold">${escapeHtml(identifier)}</span>`;
            } else {
                result += escapeHtml(identifier);
            }
            continue;
        }
        
        // Numbers
        if (/[0-9]/.test(char)) {
            let num = '';
            while (i < len && /[0-9.]/.test(code[i])) {
                num += code[i++];
            }
            result += `<span class="text-amber-500 dark:text-amber-400">${escapeHtml(num)}</span>`;
            continue;
        }
        
        // Defaults
        result += escapeHtml(char);
        i++;
    }
    
    return result;
};

export default function GenericEditorWorkspace({ text, onUpdate, language, isCompact = false }) {
    const [activeTab, setActiveTab] = useState('write');
    const [showSearch, setShowSearch] = useState(false);
    const [findText, setFindText] = useState('');
    const [replaceText, setReplaceText] = useState('');
    const [searchStatus, setSearchStatus] = useState('');
    const [splitRatio, setSplitRatio] = useState(50);
    const [fontSize, setFontSize] = useState(12);
    const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
    const [syntaxStatus, setSyntaxStatus] = useState({ valid: true, message: '' });
    const [banner, setBanner] = useState(null);

    const textareaRef = useRef(null);
    const gutterRef = useRef(null);
    const statusTimeoutRef = useRef(null);

    const isMarkdown = (language || '').toLowerCase() === 'md';

    // Synchronize code scrolling with gutter line numbers
    const handleScroll = () => {
        if (textareaRef.current && gutterRef.current) {
            gutterRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    // Calculate line numbers
    const lines = (text || '').split('\n');
    const lineNumbers = Array.from({ length: lines.length }, (_, i) => i + 1);

    // Track Cursor Coordinates
    const handleCursorMovement = (e) => {
        const textarea = e.target;
        const val = textarea.value;
        const start = textarea.selectionStart;
        const textBeforeCursor = val.substring(0, start);
        const lineCount = textBeforeCursor.split('\n').length;
        const colCount = textBeforeCursor.split('\n').pop().length + 1;
        setCursorPos({ line: lineCount, col: colCount });
    };

    // Auto-clear banner timer
    useEffect(() => {
        if (banner && banner.type !== 'error') {
            const t = setTimeout(() => setBanner(null), 3000);
            return () => clearTimeout(t);
        }
    }, [banner]);

    // Live Syntax Checker
    useEffect(() => {
        if (!text || !text.trim()) {
            setSyntaxStatus({ valid: true, message: '' });
            return;
        }
        const l = (language || '').toLowerCase();
        if (l === 'json') {
            try {
                JSON.parse(text);
                setSyntaxStatus({ valid: true, message: 'Valid JSON' });
            } catch (e) {
                setSyntaxStatus({ valid: false, message: 'JSON Syntax Error' });
            }
        } else {
            setSyntaxStatus({ valid: true, message: '' });
        }
    }, [text, language]);

    // Split pane resize handler
    const handleSplitResizeStart = (e) => {
        e.preventDefault();
        const startX = e.clientX;
        const startRatio = splitRatio;
        const container = e.currentTarget.parentElement;
        if (!container) return;
        const containerWidth = container.clientWidth;

        const handleMouseMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const deltaRatio = (deltaX / containerWidth) * 100;
            setSplitRatio(Math.max(20, Math.min(80, startRatio + deltaRatio)));
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // Calculate document statistics
    const stats = useMemo(() => {
        const cleanText = text || '';
        const chars = cleanText.length;
        const words = cleanText.trim() === '' ? 0 : cleanText.trim().split(/\s+/).length;
        const linesCount = cleanText.split('\n').length;
        return { words, chars, lines: linesCount };
    }, [text]);

    // HTML compile for markdown notes
    const compiledHtml = useMemo(() => {
        if (!isMarkdown) return '';
        return marked.parse(text || "*Empty note profile. Start typing to write ideas...*");
    }, [text, isMarkdown]);

    // Highlighted markup for code notes
    const highlightedCodeHtml = useMemo(() => {
        if (isMarkdown) return '';
        return highlightCode(text, language);
    }, [text, language, isMarkdown]);

    const showStatus = (msg) => {
        setSearchStatus(msg);
        if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
        statusTimeoutRef.current = setTimeout(() => {
            setSearchStatus('');
        }, 3000);
    };

    // Generic formatting actions
    const handleInsertMarkup = ({ prefix, suffix, placeholder }) => {
        const textarea = textareaRef.current;
        const currentText = text || '';
        if (!textarea) {
            onUpdate(currentText + prefix + placeholder + suffix);
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = currentText.substring(start, end);
        const replacement = selected ? prefix + selected + suffix : prefix + placeholder + suffix;
        const newText = currentText.substring(0, start) + replacement + currentText.substring(end);
        onUpdate(newText);

        setTimeout(() => {
            textarea.focus();
            if (selected) {
                textarea.setSelectionRange(start, start + replacement.length);
            } else {
                textarea.setSelectionRange(start + prefix.length, start + prefix.length + placeholder.length);
            }
        }, 0);
    };

    const handleUndo = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.focus();
        try {
            document.execCommand('undo', false, null);
        } catch (e) {
            console.warn('Undo failed:', e);
        }
    };

    const handleRedo = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.focus();
        try {
            document.execCommand('redo', false, null);
        } catch (e) {
            console.warn('Redo failed:', e);
        }
    };

    const handleCopy = async () => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = (text || '').substring(start, end);
        if (selectedText) {
            try {
                await navigator.clipboard.writeText(selectedText);
                setBanner({ type: 'success', message: 'Copied selection to clipboard.' });
            } catch (err) {
                setBanner({ type: 'error', message: 'Failed to copy selection.' });
            }
        } else {
            setBanner({ type: 'info', message: 'Select text to copy.' });
        }
    };

    const handleCut = async () => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = (text || '').substring(start, end);
        if (selectedText) {
            try {
                await navigator.clipboard.writeText(selectedText);
                const currentText = text || '';
                onUpdate(currentText.substring(0, start) + currentText.substring(end));
                setBanner({ type: 'success', message: 'Cut selection.' });
                setTimeout(() => {
                    textarea.focus();
                    textarea.setSelectionRange(start, start);
                }, 0);
            } catch (err) {
                setBanner({ type: 'error', message: 'Failed to cut selection.' });
            }
        } else {
            setBanner({ type: 'info', message: 'Select text to cut.' });
        }
    };

    const handlePaste = async () => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        try {
            const clipboardText = await navigator.clipboard.readText();
            if (clipboardText) {
                const currentText = text || '';
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                onUpdate(currentText.substring(0, start) + clipboardText + currentText.substring(end));
                setBanner({ type: 'success', message: 'Pasted clipboard content.' });
                setTimeout(() => {
                    textarea.focus();
                    textarea.setSelectionRange(start + clipboardText.length, start + clipboardText.length);
                }, 0);
            } else {
                setBanner({ type: 'info', message: 'Clipboard is empty.' });
            }
        } catch (err) {
            textarea.focus();
            try {
                if (document.execCommand('paste')) {
                    setBanner({ type: 'success', message: 'Pasted clipboard content.' });
                } else {
                    setBanner({ type: 'error', message: 'Paste blocked. Use Ctrl+V.' });
                }
            } catch (e) {
                setBanner({ type: 'error', message: 'Use Ctrl+V to paste.' });
            }
        }
    };

    // Helper SQL formatter (capitalizes SQL keywords and standardizes layout formatting)
    const formatSql = (sqlText) => {
        let result = '';
        let i = 0;
        const len = sqlText.length;
        const sqlKeywords = new Set(['select', 'from', 'where', 'insert', 'into', 'values', 'update', 'set', 'delete', 'create', 'table', 'drop', 'alter', 'index', 'join', 'inner', 'left', 'right', 'on', 'and', 'or', 'not', 'in', 'like', 'is', 'null', 'order', 'by', 'limit', 'group', 'having', 'count', 'sum', 'avg', 'min', 'max', 'distinct', 'as', 'union', 'all', 'primary', 'key', 'foreign', 'references', 'default', 'returning', 'with', 'recursive', 'offset']);
        
        const escapeHtml = (text) => {
            if (!text) return '';
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        };
        
        while (i < len) {
            const char = sqlText[i];
            
            // Comments --
            if (char === '-' && sqlText[i+1] === '-') {
                while (i < len && sqlText[i] !== '\n') {
                    result += sqlText[i++];
                }
                continue;
            }
            
            // Comments /* */
            if (char === '/' && sqlText[i+1] === '*') {
                result += '/*';
                i += 2;
                while (i < len) {
                    if (sqlText[i] === '*' && sqlText[i+1] === '/') {
                        result += '*/';
                        i += 2;
                        break;
                    }
                    result += sqlText[i++];
                }
                continue;
            }
            
            // Strings
            if (char === '"' || char === "'") {
                const quote = char;
                result += quote;
                i++;
                while (i < len) {
                    if (sqlText[i] === '\\') {
                        result += '\\' + (sqlText[i+1] || '');
                        i += 2;
                    } else if (sqlText[i] === quote) {
                        result += quote;
                        i++;
                        break;
                    } else {
                        result += sqlText[i++];
                    }
                }
                continue;
            }
            
            // Keywords
            if (/[a-zA-Z_]/.test(char)) {
                let word = '';
                while (i < len && /[a-zA-Z0-9_]/.test(sqlText[i])) {
                    word += sqlText[i++];
                }
                if (sqlKeywords.has(word.toLowerCase())) {
                    result += word.toUpperCase();
                } else {
                    result += word;
                }
                continue;
            }
            
            result += char;
            i++;
        }
        
        // Brackets / Layout indentation format
        const lines = result.split('\n');
        let indent = 0;
        return lines.map(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith(')') || trimmed.startsWith('}')) {
                indent = Math.max(0, indent - 1);
            }
            const space = '  '.repeat(indent);
            const processed = space + trimmed;
            if (trimmed.endsWith('(') || trimmed.endsWith('{')) {
                indent++;
            }
            return processed;
        }).join('\n');
    };

    // Generic code formatter / beautifier
    const handleFormatCode = () => {
        if (!text || !text.trim()) {
            setBanner({ type: 'error', message: 'No content to format.' });
            return;
        }
        const l = (language || '').toLowerCase();
        try {
            if (l === 'json') {
                const parsed = JSON.parse(text);
                onUpdate(JSON.stringify(parsed, null, 2));
                setBanner({ type: 'success', message: 'JSON formatted successfully!' });
            } else if (l === 'properties') {
                const lines = text.split('\n');
                const formatted = lines.map(line => {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) return line;
                    const match = trimmed.match(/^([^=:]+)([\s=:].*)$/);
                    if (match) {
                        const key = match[1].trim();
                        let rest = match[2].trim();
                        const sep = rest.startsWith('=') ? '=' : rest.startsWith(':') ? ':' : '=';
                        let val = rest.substring(1).trim();
                        return `${key} ${sep} ${val}`;
                    }
                    return trimmed;
                }).join('\n');
                onUpdate(formatted);
                setBanner({ type: 'success', message: 'Properties file formatted!' });
            } else if (l === 'yml' || l === 'yaml') {
                const lines = text.split('\n');
                const formatted = lines.map(line => {
                    if (!line.trim() || line.trim().startsWith('#')) return line.trimRight();
                    const parts = line.split(':');
                    if (parts.length > 1 && !line.includes('://')) {
                        const key = parts[0];
                        const rest = parts.slice(1).join(':').trim();
                        return key + ': ' + rest;
                    }
                    return line.trimRight();
                }).join('\n');
                onUpdate(formatted);
                setBanner({ type: 'success', message: 'YAML file formatted!' });
            } else if (l === 'sql') {
                const formatted = formatSql(text);
                onUpdate(formatted);
                setBanner({ type: 'success', message: 'PostgreSQL formatted successfully!' });
            } else if (['js', 'jsx', 'ts', 'tsx', 'java', 'css', 'html', 'xml'].includes(l)) {
                const lines = text.split('\n');
                let indent = 0;
                const formatted = lines.map(line => {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith('</') || trimmed.startsWith(')')) {
                        indent = Math.max(0, indent - 1);
                    }
                    const space = '  '.repeat(indent);
                    const processed = space + trimmed;
                    if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(') || (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>') && !trimmed.includes('</'))) {
                        indent++;
                    }
                    return processed;
                }).join('\n');
                onUpdate(formatted);
                setBanner({ type: 'success', message: `${language.toUpperCase()} auto-formatted!` });
            } else {
                setBanner({ type: 'info', message: `Formatting not supported for ${language.toUpperCase()}.` });
            }
        } catch (err) {
            setBanner({ type: 'error', message: `Format failed: ${err.message}` });
        }
    };

    // Find and Replace functions
    const findNext = () => {
        const textarea = textareaRef.current;
        if (!textarea || !findText) {
            showStatus('Enter search term');
            return;
        }
        const currentText = text || '';
        const start = textarea.selectionEnd;
        let index = currentText.toLowerCase().indexOf(findText.toLowerCase(), start);

        if (index === -1) {
            index = currentText.toLowerCase().indexOf(findText.toLowerCase(), 0);
            if (index !== -1) {
                showStatus('Wrapped to top');
            } else {
                showStatus('No matches found');
                return;
            }
        } else {
            showStatus('Found match');
        }

        if (index !== -1) {
            textarea.focus();
            textarea.setSelectionRange(index, index + findText.length);
        }
    };

    const replaceCurrent = () => {
        const textarea = textareaRef.current;
        if (!textarea || !findText) return;
        const currentText = text || '';
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = currentText.substring(start, end);

        if (selected.toLowerCase() === findText.toLowerCase()) {
            onUpdate(currentText.substring(0, start) + replaceText + currentText.substring(end));
            showStatus('Replaced');
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start, start + replaceText.length);
                findNext();
            }, 0);
        } else {
            findNext();
        }
    };

    const replaceAll = () => {
        const textarea = textareaRef.current;
        if (!textarea || !findText) return;
        const currentText = text || '';
        const escapedFind = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedFind, 'gi');
        const matches = currentText.match(regex);
        const count = matches ? matches.length : 0;

        if (count > 0) {
            onUpdate(currentText.replace(regex, replaceText));
            showStatus(`Replaced ${count} occurrences`);
        } else {
            showStatus('No matches found');
        }
    };

    // Keyboard hotkeys
    const handleKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
            const key = e.key.toLowerCase();
            if (key === 'b' && isMarkdown) {
                e.preventDefault();
                handleInsertMarkup({ prefix: '**', suffix: '**', placeholder: 'Bold' });
            } else if (key === 'i' && isMarkdown) {
                e.preventDefault();
                handleInsertMarkup({ prefix: '*', suffix: '*', placeholder: 'Italic' });
            } else if (key === 'k' && isMarkdown) {
                e.preventDefault();
                handleInsertMarkup({ prefix: '[', suffix: '](https://)', placeholder: 'Link text' });
            } else if (key === 'f') {
                e.preventDefault();
                setShowSearch(prev => !prev);
            }
        }
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden shadow-lg select-text no-drag p-2">
            
            {/* Redesigned Generic Toolbar */}
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2 mb-2 select-none flex-wrap gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                    {/* View Modes */}
                    <div className="flex bg-black/5 dark:bg-white/5 p-0.5 rounded-lg border border-black/5 dark:border-white/5">
                        <button
                            type="button"
                            onClick={() => setActiveTab('write')}
                            className={`px-2.5 py-1 rounded-md text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                                activeTab === 'write' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            <FontAwesomeIcon icon={faPen} className="text-[8px]" /> Write
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('preview')}
                            className={`px-2.5 py-1 rounded-md text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                                activeTab === 'preview' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            <FontAwesomeIcon icon={faEye} className="text-[8px]" /> View
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('dual')}
                            className={`px-2.5 py-1 rounded-md text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                                activeTab === 'dual' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            <FontAwesomeIcon icon={faColumns} className="text-[8px]" /> Split
                        </button>
                    </div>

                    <div className="w-[1px] h-4 bg-black/10 dark:bg-white/10 mx-1" />

                    {/* Common Editing Actions */}
                    <div className="flex bg-black/5 dark:bg-white/5 p-0.5 rounded-lg border border-black/5 dark:border-white/5">
                        <button type="button" onClick={handleUndo} title="Undo" className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer transition-colors"><FontAwesomeIcon icon={faUndo} className="text-[8px]" /></button>
                        <button type="button" onClick={handleRedo} title="Redo" className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer transition-colors"><FontAwesomeIcon icon={faRedo} className="text-[8px]" /></button>
                        <button type="button" onClick={handleCut} title="Cut" className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer transition-colors"><FontAwesomeIcon icon={faCut} className="text-[8px]" /></button>
                        <button type="button" onClick={handleCopy} title="Copy" className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer transition-colors"><FontAwesomeIcon icon={faCopy} className="text-[8px]" /></button>
                        <button type="button" onClick={handlePaste} title="Paste" className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer transition-colors"><FontAwesomeIcon icon={faPaste} className="text-[8px]" /></button>
                    </div>

                    <div className="w-[1px] h-4 bg-black/10 dark:bg-white/10 mx-1" />

                    {/* Font Size Adjusters */}
                    <div className="flex bg-black/5 dark:bg-white/5 p-0.5 rounded-lg border border-black/5 dark:border-white/5 items-center gap-1">
                        <button type="button" onClick={() => setFontSize(prev => Math.max(8, prev - 1))} title="Decrease Text Size" className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer transition-all"><FontAwesomeIcon icon={faMagnifyingGlassMinus} className="text-[8px]" /></button>
                        <span className="text-[8px] font-extrabold text-slate-550 w-5 text-center">{fontSize}px</span>
                        <button type="button" onClick={() => setFontSize(prev => Math.min(24, prev + 1))} title="Increase Text Size" className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer transition-all"><FontAwesomeIcon icon={faMagnifyingGlassPlus} className="text-[8px]" /></button>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    {/* Contextual Insert Actions */}
                    {activeTab !== 'preview' && isMarkdown && (
                        <div className="flex items-center gap-0.5 bg-black/5 dark:bg-white/5 p-0.5 rounded-lg border border-black/5 dark:border-white/5">
                            <button type="button" onClick={() => handleInsertMarkup({ prefix: '**', suffix: '**', placeholder: 'Bold' })} title="Bold" className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded text-slate-500 hover:text-slate-800 dark:text-slate-450 dark:hover:text-slate-250 cursor-pointer text-[8px]"><FontAwesomeIcon icon={faBold} /></button>
                            <button type="button" onClick={() => handleInsertMarkup({ prefix: '*', suffix: '*', placeholder: 'Italic' })} title="Italic" className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded text-slate-500 hover:text-slate-800 dark:text-slate-450 dark:hover:text-slate-250 cursor-pointer text-[8px]"><FontAwesomeIcon icon={faItalic} /></button>
                            <button type="button" onClick={() => handleInsertMarkup({ prefix: '~~', suffix: '~~', placeholder: 'Strikethrough' })} title="Strikethrough" className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded text-slate-500 hover:text-slate-800 dark:text-slate-450 dark:hover:text-slate-250 cursor-pointer text-[8px]"><FontAwesomeIcon icon={faStrikethrough} /></button>
                            <button type="button" onClick={() => handleInsertMarkup({ prefix: '<mark>', suffix: '</mark>', placeholder: 'Highlight' })} title="Highlight" className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded text-slate-500 hover:text-slate-800 dark:text-slate-450 dark:hover:text-slate-250 cursor-pointer text-[8px]"><FontAwesomeIcon icon={faHighlighter} /></button>
                            <button type="button" onClick={() => handleInsertMarkup({ prefix: '[', suffix: '](https://)', placeholder: 'Link text' })} title="Link" className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded text-slate-500 hover:text-slate-800 dark:text-slate-450 dark:hover:text-slate-250 cursor-pointer text-[8px]"><FontAwesomeIcon icon={faLink} /></button>
                            <button type="button" onClick={() => handleInsertMarkup({ prefix: '\n- ', suffix: '\n', placeholder: 'List item' })} title="List" className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded text-slate-500 hover:text-slate-800 dark:text-slate-450 dark:hover:text-slate-250 cursor-pointer text-[8px]"><FontAwesomeIcon icon={faListUl} /></button>
                        </div>
                    )}

                    {activeTab !== 'preview' && !isMarkdown && (
                        <button
                            type="button"
                            onClick={handleFormatCode}
                            title="Auto Format Code Layout"
                            className="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 border border-indigo-150 dark:border-indigo-800 rounded-lg text-[9px] font-bold text-indigo-705 dark:text-indigo-300 px-2 py-1 flex items-center gap-1 transition-all cursor-pointer"
                        >
                            <FontAwesomeIcon icon={faCode} /> Format
                        </button>
                    )}

                    {/* Find and Replace Panel Toggle */}
                    <button
                        type="button"
                        onClick={() => setShowSearch(!showSearch)}
                        title="Find & Replace (Ctrl+F)"
                        className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                            showSearch ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                    >
                        <FontAwesomeIcon icon={faSearch} />
                    </button>
                </div>
            </div>

            {/* Notification Banner */}
            {banner && (
                <div className={`px-3.5 py-1.5 text-[9px] font-semibold flex items-center justify-between rounded-lg mb-2 shadow-inner select-none transition-all ${
                    banner.type === 'error' ? 'bg-rose-50 border border-rose-250 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900/40 dark:text-rose-300' : 'bg-emerald-50 border border-emerald-250 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900/40 dark:text-emerald-300'
                }`}>
                    <span>{banner.message}</span>
                    <button onClick={() => setBanner(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"><FontAwesomeIcon icon={faXmark} /></button>
                </div>
            )}

            {/* Find and Replace Panel */}
            {showSearch && (
                <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-100/50 dark:bg-slate-950/40 rounded-xl border border-black/5 dark:border-white/5 mb-2 animate-in slide-in-from-top-2 duration-150 select-none">
                    <div className="flex items-center gap-1.5 flex-1 min-w-[150px]">
                        <span className="text-[8px] font-extrabold text-slate-450 select-none uppercase tracking-wider">Find:</span>
                        <input
                            type="text"
                            value={findText}
                            onChange={(e) => setFindText(e.target.value)}
                            placeholder="Find..."
                            className="flex-1 px-2 py-1 bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-lg text-xs focus:outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                            onKeyDown={e => e.key === 'Enter' && findNext()}
                        />
                    </div>
                    <div className="flex items-center gap-1.5 flex-1 min-w-[150px]">
                        <span className="text-[8px] font-extrabold text-slate-455 select-none uppercase tracking-wider">Replace:</span>
                        <input
                            type="text"
                            value={replaceText}
                            onChange={(e) => setReplaceText(e.target.value)}
                            placeholder="Replace..."
                            className="flex-1 px-2 py-1 bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-lg text-xs focus:outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                            onKeyDown={e => e.key === 'Enter' && replaceCurrent()}
                        />
                    </div>
                    <div className="flex items-center gap-1">
                        <button type="button" onClick={findNext} title="Find Next" className="p-1.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-[9px] font-semibold text-slate-600 dark:text-slate-350 cursor-pointer"><FontAwesomeIcon icon={faArrowDown} /></button>
                        <button type="button" onClick={replaceCurrent} className="px-2 py-1 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-[9px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer">Replace</button>
                        <button type="button" onClick={replaceAll} className="px-2 py-1 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-[9px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer">Replace All</button>
                        <button type="button" onClick={() => setShowSearch(false)} className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"><FontAwesomeIcon icon={faXmark} /></button>
                    </div>
                    {searchStatus && <div className="text-[8px] font-extrabold uppercase tracking-wider text-indigo-500 px-1 animate-pulse">{searchStatus}</div>}
                </div>
            )}

            {/* Workspace Editor Area */}
            <div className="flex-1 flex min-h-0 overflow-hidden relative">
                {activeTab === 'write' && (
                    <div className="flex-1 flex min-h-0 overflow-hidden">
                        {/* Gutter / Line Numbers */}
                        <div 
                            ref={gutterRef}
                            style={{ fontSize: `${fontSize}px` }}
                            className="w-9 bg-black/5 dark:bg-white/5 text-slate-400 dark:text-slate-500 text-right pr-2 py-3 select-none overflow-y-hidden border-r border-black/5 dark:border-white/5 font-mono leading-relaxed flex flex-col transition-all"
                        >
                            {lineNumbers.map(n => <span key={n}>{n}</span>)}
                        </div>
                        {/* Editor Input */}
                        <textarea
                            ref={textareaRef}
                            value={text || ''}
                            onChange={(e) => onUpdate(e.target.value)}
                            onScroll={handleScroll}
                            onKeyUp={handleCursorMovement}
                            onMouseUp={handleCursorMovement}
                            onFocus={handleCursorMovement}
                            onKeyDown={handleKeyDown}
                            style={{ fontSize: `${fontSize}px` }}
                            placeholder={`Type note contents or ${language || 'code'} tags here...`}
                            className={`flex-1 h-full bg-transparent text-slate-800 dark:text-slate-100 px-3 py-3 font-mono leading-relaxed focus:outline-none resize-none overflow-y-auto text-left transition-all ${
                                isMarkdown ? 'whitespace-pre-wrap overflow-x-hidden' : 'whitespace-pre overflow-x-auto'
                            }`}
                            spellCheck={isMarkdown}
                        />
                    </div>
                )}

                {activeTab === 'preview' && (
                    <div className="w-full flex-1 overflow-y-auto text-slate-800 dark:text-slate-100 p-2 text-left scrollbar-none">
                        {isMarkdown ? (
                            <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: compiledHtml }} />
                        ) : language === 'html' ? (
                            <iframe srcDoc={text} title="HTML Sandbox Render Preview" className="w-full h-full border-none bg-white rounded-xl shadow-sm min-h-[250px]" sandbox="allow-scripts" />
                        ) : (
                            <pre className="font-mono text-[10px] leading-relaxed bg-slate-950 text-slate-200 p-4 rounded-xl overflow-auto text-left shadow-inner border border-white/5" dangerouslySetInnerHTML={{ __html: highlightedCodeHtml }} />
                        )}
                    </div>
                )}

                {activeTab === 'dual' && (
                    <div className={`w-full flex-1 flex min-h-0 overflow-hidden ${isCompact ? 'flex-col gap-2' : 'flex-row'}`}>
                        {/* Editor Split */}
                        <div style={isCompact ? { height: '50%' } : { width: `${splitRatio}%` }} className={`flex min-h-0 min-w-0 border-black/5 dark:border-white/5 ${isCompact ? 'border-b pb-2' : 'pr-2 border-r'}`}>
                            <div className="flex-1 flex min-h-0 overflow-hidden">
                                <div ref={gutterRef} style={{ fontSize: `${fontSize}px` }} className="w-9 bg-black/5 dark:bg-white/5 text-slate-400 dark:text-slate-500 text-right pr-2 py-3 select-none overflow-y-hidden border-r border-black/5 dark:border-white/5 font-mono leading-relaxed flex flex-col transition-all">
                                    {lineNumbers.map(n => <span key={n}>{n}</span>)}
                                </div>
                                <textarea
                                    ref={textareaRef}
                                    value={text || ''}
                                    onChange={(e) => onUpdate(e.target.value)}
                                    onScroll={handleScroll}
                                    onKeyUp={handleCursorMovement}
                                    onMouseUp={handleCursorMovement}
                                    onFocus={handleCursorMovement}
                                    onKeyDown={handleKeyDown}
                                    style={{ fontSize: `${fontSize}px` }}
                                    placeholder="Type code or markdown here..."
                                    className={`flex-1 h-full bg-transparent text-slate-800 dark:text-slate-100 px-3 py-3 font-mono leading-relaxed focus:outline-none resize-none overflow-y-auto text-left transition-all ${
                                        isMarkdown ? 'whitespace-pre-wrap overflow-x-hidden' : 'whitespace-pre overflow-x-auto'
                                    }`}
                                    spellCheck={isMarkdown}
                                />
                            </div>
                        </div>

                        {/* Split Resizer Divider Handle */}
                        {!isCompact && (
                            <div
                                onMouseDown={handleSplitResizeStart}
                                className="w-1 cursor-col-resize hover:bg-indigo-500/50 bg-black/[0.03] hover:w-[6px] hover:-mx-[1px] transition-all duration-150 z-30 select-none flex-shrink-0"
                                title="Drag to adjust split width"
                            />
                        )}

                        {/* Preview Split */}
                        <div style={isCompact ? { height: '50%' } : { width: `${100 - splitRatio}%` }} className={`flex flex-col min-h-0 min-w-0 overflow-y-auto scrollbar-none ${isCompact ? 'pt-2' : 'pl-2'}`}>
                            {isMarkdown ? (
                                <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed text-left" dangerouslySetInnerHTML={{ __html: compiledHtml }} />
                            ) : language === 'html' ? (
                                <iframe srcDoc={text} title="HTML Sandbox Render Preview" className="w-full h-full border-none bg-white rounded-xl shadow-sm min-h-[200px]" sandbox="allow-scripts" />
                            ) : (
                                <pre className="font-mono text-[10px] leading-relaxed bg-slate-950 text-slate-200 p-3 rounded-xl overflow-auto text-left shadow-inner border border-white/5" dangerouslySetInnerHTML={{ __html: highlightedCodeHtml }} />
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Redesigned Bottom Status Bar */}
            <div className="bg-black/5 dark:bg-white/5 border-t border-black/5 dark:border-white/5 px-3.5 py-1 flex items-center justify-between text-[9px] font-bold text-slate-500 dark:text-slate-400 select-none rounded-b-xl mt-2 select-none flex-wrap gap-2">
                <div className="flex items-center gap-3">
                    {/* Active Mode indicator */}
                    <span className="flex items-center gap-1 uppercase tracking-wider">
                        <FontAwesomeIcon icon={isMarkdown ? faPen : faTerminal} className="text-slate-400" />
                        {language || 'TXT'} MODE
                    </span>
                    <span className="w-[1.5px] h-2.5 bg-black/10 dark:bg-white/10" />
                    {/* Cursor Position indicator */}
                    <span className="font-mono">
                        LN {cursorPos.line}, COL {cursorPos.col}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    {/* Syntax Status */}
                    {syntaxStatus.message && (
                        <>
                            <span className={`flex items-center gap-1 ${syntaxStatus.valid ? 'text-emerald-500' : 'text-rose-500'}`}>
                                <FontAwesomeIcon icon={syntaxStatus.valid ? faCheck : faTriangleExclamation} />
                                {syntaxStatus.message}
                            </span>
                            <span className="w-[1.5px] h-2.5 bg-black/10 dark:bg-white/10" />
                        </>
                    )}
                    {/* Word counts stats */}
                    <span>{stats.words} WORDS</span>
                    <span>{stats.chars} CHARS</span>
                    <span>{stats.lines} LINES</span>
                    <span className="w-[1.5px] h-2.5 bg-black/10 dark:bg-white/10" />
                    {/* Database sync status */}
                    <span className="flex items-center gap-1 text-slate-400 animate-pulse">
                        <FontAwesomeIcon icon={faFloppyDisk} />
                        SYNC SAVED
                    </span>
                </div>
            </div>

        </div>
    );
}
