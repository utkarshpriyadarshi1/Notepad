import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faBold, faCode, faHeading, faItalic, faLink} from '@fortawesome/free-solid-svg-icons';

export default function MarkdownToolbar({onInsertMarkup}) {
    const formats = [{id: 'bold', icon: faBold, syntax: '**Bold**', title: 'Bold text'}, {
        id: 'italic',
        icon: faItalic,
        syntax: '*Italic*',
        title: 'Italic text'
    }, {id: 'header', icon: faHeading, syntax: '\n# Header\n', title: 'Heading'}, {
        id: 'code',
        icon: faCode,
        syntax: '`Code`',
        title: 'Inline code'
    }, {id: 'link', icon: faLink, syntax: '[Link text](https://)', title: 'Insert hyperlink'}];

    return (<div style={{WebkitAppRegion: 'no-drag'}}
                 className="no-drag bg-black/5 rounded-lg px-2 py-1 flex gap-2 items-center mb-2 animate-in fade-in duration-100">
            <span className="text-[9px] uppercase tracking-wider opacity-40 font-bold mr-1">Format:</span>
            {formats.map(fmt => (<button
                    key={fmt.id}
                    type="button"
                    onClick={() => onInsertMarkup(fmt.syntax)}
                    className="p-1 hover:bg-black/10 rounded text-[10px] text-slate-700 hover:text-black cursor-pointer transition-colors"
                    title={fmt.title}
                >
                    <FontAwesomeIcon icon={fmt.icon}/>
                </button>))}
        </div>);
}
