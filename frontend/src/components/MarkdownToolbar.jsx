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
        {id: 'bold', icon: faBold, syntax: '**Bold**'},
        {id: 'italic', icon: faItalic, syntax: '*Italic*'},
        {id: 'strikethrough', icon: faStrikethrough, syntax: '~~Strikethrough~~'},
        {id: 'header', icon: faHeading, syntax: '\n# Header\n'},
        {id: 'list-ul', icon: faListUl, syntax: '\n- Bullet Item\n'},
        {id: 'list-ol', icon: faListOl, syntax: '\n1. Numbered Item\n'},
        {id: 'blockquote', icon: faQuoteLeft, syntax: '\n> Quote\n'},
        {id: 'code', icon: faCode, syntax: '`Code`'},
        {id: 'link', icon: faLink, syntax: '[Link text](https://)'},
        {id: 'hr', icon: faMinus, syntax: '\n---\n'}
    ];

    return (<div style={{WebkitAppRegion: 'no-drag'}}
                 className="no-drag bg-black/5 rounded-lg px-2 py-1 flex flex-wrap gap-1.5 items-center mb-2 animate-in fade-in duration-100">
            <span className="text-[9px] uppercase tracking-wider opacity-40 font-bold mr-1">Format:</span>
            {formats.map((fmt) => (
                <button
                    key={fmt.id}
                    type="button"
                    onClick={() => onInsertMarkup(fmt.syntax)}
                    className="p-1 hover:bg-black/10 rounded text-[10px] text-slate-700 hover:text-black cursor-pointer transition-colors"
                >
                    <FontAwesomeIcon icon={fmt.icon}/>
                </button>
            ))}
        </div>);
}
