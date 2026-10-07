'use client';
import {money,totals,type Data} from '@/lib/model';

export default function DocumentCostSummary({data,onChange}:{data:Data;onChange:(data:Data)=>void}){
 const lines:Data[]=data.lines||[],result:Data=totals(data);
 const materials=lines.reduce((sum,line)=>sum+(line.pricing_mode==='split'?Number(line.quantity||0)*Number(line.material_cost||0):0),0);
 const labour=lines.reduce((sum,line)=>sum+(line.pricing_mode==='split'?Number(line.quantity||0)*Number(line.labour_cost||0):0),0);
 const other=lines.reduce((sum,line)=>sum+(line.pricing_mode!=='split'?Number(line.quantity||0)*Number(line.price||0):0),0);
 const markup=Number(data.markup||0),profit=markup/(100+markup)*100;
 return <section className="document-cost-summary"><h3>Détails des coûts · avant taxes</h3><dl><div><dt>Matériaux</dt><dd>{money(materials)}</dd></div><div><dt>Main-d’œuvre</dt><dd>{money(labour)}</dd></div>{other>0&&<div><dt>Autres postes à prix unitaire</dt><dd>{money(other)}</dd></div>}<div><dt>Majoration des lignes</dt><dd>{money(Number(result.lineMargin||0))}</dd></div><div><dt>Majoration globale</dt><dd>{money(Number(result.markup||0))}</dd></div></dl><label>Marge globale sur le montant après majoration des lignes (%)<input type="number" min="0" max="99.99" step=".01" value={Math.round(profit*100)/100} onChange={e=>{const value=Math.min(99.99,Math.max(0,Number(e.target.value)||0));onChange({...data,markup:value/(100-value)*100})}}/></label><p>La marge globale s’ajoute aux majorations des lignes. Laissez-la à zéro si le profit est déjà inclus dans chaque ligne.</p></section>;
}
