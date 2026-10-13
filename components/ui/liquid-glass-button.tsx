import type {ReactNode,MouseEventHandler,FocusEventHandler} from 'react';

export function GlassFilter(){return <svg className="mg-liquid-filter" aria-hidden="true" width="0" height="0"><defs><filter id="mg-container-glass" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.05 0.05" numOctaves="1" seed="1" result="turbulence"/><feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise"/><feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="70" xChannelSelector="R" yChannelSelector="B" result="displaced"/><feGaussianBlur in="displaced" stdDeviation="4" result="finalBlur"/><feComposite in="finalBlur" in2="finalBlur" operator="over"/></filter></defs></svg>}

type Props={children:ReactNode;href?:string;external?:boolean;onClick?:()=>void;onMouseEnter?:MouseEventHandler;onFocus?:FocusEventHandler;onBlur?:FocusEventHandler};
export function LiquidButton({children,href,external,onClick,onMouseEnter,onFocus,onBlur}:Props){
 const content=<span className="mg-liquid-content">{children}</span>;
 const shared={className:'mg-liquid-button',onMouseEnter,onFocus,onBlur};
 return href?<a {...shared} href={href} target={external?'_blank':undefined} rel={external?'noopener noreferrer':undefined}>{content}</a>:<button {...shared} type="button" onClick={onClick}>{content}</button>;
}
