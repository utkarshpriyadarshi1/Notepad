import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
    faBold,
    faCode,
    faHeading,
    faItalic,
    faLink,
    faStrikethrough,
    faListUl,
    faListOl,
    faQuoteLeft,
    faMinus
} from '@fortawesome/free-solid-svg-icons';

export default function MarkdownToolbar({onInsertMarkup}) {
    const formats = [
        {id: 'bold', icon: faBold, syntax: '**Bold**', title: 'Bold'},
        {id: 'italic', icon: faItalic, syntax: '*Italic*', title: 'Italic'},
        {id: 'strikethrough', icon: faStrikethrough, syntax: '~~Strikethrough~~', title: 'Strikethrough'},
        {id: 'header', icon: faHeading, syntax: '\n# Header\n', title: 'Heading'},
        {id: 'list-ul', icon: faListUl, syntax: '\n- Bullet Item\n', title: 'Bullet List'},
        {id: 'list-ol', icon: faListOl, syntax: '\n1. Numbered Item\n', title: 'Numbered List'},
        {id: 'blockquote', icon: faQuoteLeft, syntax: '\n> Quote\n', title: 'Blockquote'},
        {id: 'code', icon: faCode, syntax: '`Code`', title: 'Inline Code'},
        {id: 'link', icon: faLink, syntax: '[Link text](https://)', title: 'Insert Link'},
        {id: 'hr', icon: faMinus, syntax: '\n---\n', title: 'Horizontal Line'}
    ];

    return (<div style={{WebkitAppRegion: 'no-drag'}}
                 className="no-drag bg-black/5 rounded-lg px-2 py-1 flex flex-wrap gap-1.5 items-center mb-2 animate-in fade-in duration-100">
            <span className="text-[9px] uppercase tracking-wider opacity-40 font-bold mr-1">Format:</span>
            {formats.map((fmt, idx) => {
                // Dynamically align tooltips to prevent edge clipping
                let tooltipAlign = "left-1/2 -translate-x-1/2";
                if (idx < 2) tooltipAlign = "left-0 translate-x-0";
                if (idx > formats.length - 3) tooltipAlign = "right-0 translate-x-0";

                return (
                    <div key={fmt.id} className="group relative flex items-center">
                        <button
                            type="button"
                            onClick={() => onInsertMarkup(fmt.syntax)}
                            className="p-1 hover:bg-black/10 rounded text-[10px] text-slate-700 hover:text-black cursor-pointer transition-colors"
                        >
                            <FontAwesomeIcon icon={fmt.icon}/>
                        </button>
                        <div className={`absolute bottom-full mb-1.5 ${tooltipAlign} bg-slate-900/95 text-white text-[8px] font-bold tracking-wide uppercase rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-[100] shadow-md border border-white/10`}>
                            {fmt.title}
                        </div>
                    </div>
                );
            })}
        </div>);
}
