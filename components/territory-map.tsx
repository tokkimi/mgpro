'use client';
import {useEffect,useRef} from 'react';
import 'leaflet/dist/leaflet.css';

export default function TerritoryMap({locale='fr'}:{locale?:'fr'|'en'}){
 const ref=useRef<HTMLDivElement>(null);
 const en=locale==='en';
 useEffect(()=>{
  let stopped=false;let map:import('leaflet').Map|undefined;
  void import('leaflet').then(L=>{
   if(stopped||!ref.current)return;
   map=L.map(ref.current,{scrollWheelZoom:false,zoomControl:true}).setView([45.66,-73.82],9);
   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
   L.polygon([[45.36,-74.16],[45.44,-74.37],[45.76,-74.27],[45.97,-74.10],[46.03,-73.85],[45.89,-73.52],[45.67,-73.38],[45.49,-73.51],[45.36,-73.72]],{color:'#bb8b35',weight:3,opacity:.95,fillColor:'#d9b65c',fillOpacity:.1}).addTo(map);
  });
  return()=>{stopped=true;map?.remove()};
 },[]);
 return <figure className="territory-map"><div className="territory-map-frame"><div ref={ref} className="territory-map-interactive" role="region" aria-label={en?'Interactive map of the indicative service area':'Carte interactive de la zone desservie à titre indicatif'}/></div><figcaption>{en?'Indicative service area: Laval, Montréal, the North Shore and the Laurentians.':'Zone desservie à titre indicatif : Laval, Montréal, la Rive-Nord et les Laurentides.'}</figcaption></figure>;
}
