'use client';

import {CircularRevealHeading} from './ui/circular-reveal-heading';

export default function ProjectActionWheel({onQuote,phone,email,finance}:{onQuote:()=>void;phone:string;email:string;finance:string}){
 const digits=phone.replace(/\D/g,'');
 return <section className="atelier-close atelier-wheel-close"><div className="mg-wheel-intro"><span className="section-kicker">VOTRE PROCHAIN CHAPITRE</span><h2>Faisons de la place<br/>à vos idées<span className="gold-dot">.</span></h2><p>Un projet en tête ? Choisissez comment commencer.<br/>Nous vous accompagnons dès le premier échange.</p><a className="mg-wheel-phone" href={`tel:+1${digits}`}>{phone}</a></div><CircularRevealHeading centerText="Votre prochain chapitre commence ici." items={[
  {text:'Soumission gratuite',title:'Parlons de vos idées.',detail:'Présentez votre projet et demandez votre estimation gratuite.',image:'/images/renovation-inspiration.png',imageAlt:'Cuisine lumineuse : inspiration pour votre projet de rénovation',onClick:onQuote},
  {text:'Nous appeler',title:'Un échange de vive voix.',detail:phone,image:'/images/original/entrepreneur-general-montreal-laval-img.jpg',imageAlt:'Aménagement réalisé dans un espace commercial',href:`tel:+1${digits}`},
  {text:'Nous écrire',title:'Chaque détail compte.',detail:'Vos idées, vos questions, vos besoins.',image:'/images/original/agrandissement-maison-laval-montreal.jpg',imageAlt:'Agrandissement de maison : un projet à préparer ensemble',href:`mailto:${email}`},
  {text:'Financer mon projet',title:'À votre rythme.',detail:'Explorez les solutions de financement avec Financeit.',image:'/images/original/cuisine-haut-de-gamme-quebec-01.jpg',imageAlt:'Cuisine rénovée avec îlot et finitions soignées',href:finance,external:true}
 ]}/></section>;
}
