'use client';

import galleries from '@/content/galleries.json';
import {CoverFlowCarousel} from './ui/3-d-coverflow-carousel';

const descriptions={
 fr:['Des espaces soignés, jusque dans les finitions.','Une nouvelle pièce à vivre, pensée pour vous.','Des transformations qui donnent du caractère.','Des lieux professionnels qui prennent forme.'],
 en:['Thoughtful spaces, down to the final finish.','A new living space, designed around you.','Transformations with distinctive character.','Professional spaces taking shape.']
};
const englishTitles=['Bathrooms','Basements','Residential renovation','Commercial renovation'];

export default function RealizationsCoverflow({locale='fr',onPhoto}:{locale?:'fr'|'en';onPhoto:(src:string)=>void}){
 const en=locale==='en';
 return <section className="atelier-realisations atelier-coverflow-section" id="realisations" aria-labelledby="realisations-heading">
  <div className="realisations-heading"><div><p className="section-kicker">{en?'MG PRO PROJECTS':'LES RÉALISATIONS MG PRO'}</p><h2 id="realisations-heading">{en?'Real spaces.':'Du concret.'}<br/><span>{en?'Distinctive character.':'Et du caractère.'}</span></h2></div><p>{en?'Explore our projects.':'Explorez nos réalisations.'}<br/>{en?'Bathrooms, basements, homes and businesses.':'Salles de bain, sous-sols, résidentiel et commercial.'}</p></div>
  <CoverFlowCarousel locale={locale} items={galleries.groups.map((group,index)=>({id:group.title,title:en?englishTitles[index]:group.title,description:descriptions[locale][index],photos:group.photos}))} onPhoto={onPhoto}/>
 </section>;
}
