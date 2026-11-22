// Sources for product comparison and sourcing. Catalogue rows describe material families.
const sources={
 rona:{name:'RONA',url:'https://www.rona.ca/fr'},
 depot:{name:'Home Depot Canada',url:'https://www.homedepot.ca/fr/accueil/categories/salle-de-bain.html'},
 ceragres:{name:'Céragrès',url:'https://www.ceragres.ca/boutiques/'},
 bain:{name:'Bain Dépôt',url:'https://www.baindepot.com/nos-magasins/bain-depot-quebec'},
 pierre:{name:'Caesarstone Canada',url:'https://www.caesarstone.ca/fr/'},
 facade:{name:'Maibec',url:'https://maibec.com/fr/'},
};

export function suppliersFor(category:string,subcategory:string){
 if(subcategory==='Plans de travail')return [sources.ceragres,sources.pierre,sources.rona];
 if(category==='Salles de bain')return [sources.bain,sources.depot,sources.ceragres];
 if(['Crédences','Carrelages','Carrelage mural'].includes(subcategory))return [sources.ceragres,sources.rona];
 if(/façade|bardage/i.test(category))return [sources.facade,sources.rona];
 return [sources.rona];
}
