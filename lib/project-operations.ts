import {round} from './model';

export type BudgetLine={id:string;name:string;budget:number;actual:number};
export type CostCode={id:string;code:string;name:string;budget:number};
export type PriceRequest={id:string;supplier:string;scope:string;dueOn:string;status:'Brouillon'|'Envoyée'|'Réponse reçue'|'Attribuée'|'Annulée';amount:number};
export type PurchaseOrder={id:string;supplier:string;title:string;amount:number;neededBy:string;status:'Brouillon'|'Envoyé'|'Reçu'|'Annulé'};
export type ChangeOrder={id:string;title:string;amount:number;days:number;status:'Brouillon'|'À approuver'|'Approuvée'|'Refusée'};
export type DailyLog={id:string;date:string;summary:string;blockers:string};
export type Timesheet={id:string;date:string;person:string;hours:number;hourlyRate:number;status:'Brouillon'|'Soumise'|'Approuvée'};
export type ProjectOperations={budget:BudgetLine[];costCodes:CostCode[];priceRequests:PriceRequest[];purchaseOrders:PurchaseOrder[];changeOrders:ChangeOrder[];dailyLogs:DailyLog[];timesheets:Timesheet[]};

export const emptyOperations=():ProjectOperations=>({budget:[],costCodes:[],priceRequests:[],purchaseOrders:[],changeOrders:[],dailyLogs:[],timesheets:[]});
const num=(value:unknown)=>Math.max(0,Number(value)||0);
export function operationsFrom(value:unknown):ProjectOperations{
 const source=value&&typeof value==='object'?value as Partial<ProjectOperations>:{};
 return {
  budget:Array.isArray(source.budget)?source.budget.map(line=>({id:String(line.id),name:String(line.name||'Poste'),budget:num(line.budget),actual:num(line.actual)})):[],
  costCodes:Array.isArray(source.costCodes)?source.costCodes.map(code=>({id:String(code.id),code:String(code.code||''),name:String(code.name||'Poste'),budget:num(code.budget)})):[],
  priceRequests:Array.isArray(source.priceRequests)?source.priceRequests.map(request=>({id:String(request.id),supplier:String(request.supplier||''),scope:String(request.scope||''),dueOn:String(request.dueOn||''),status:['Brouillon','Envoyée','Réponse reçue','Attribuée','Annulée'].includes(String(request.status))?request.status as PriceRequest['status']:'Brouillon',amount:num(request.amount)})):[],
  purchaseOrders:Array.isArray(source.purchaseOrders)?source.purchaseOrders.map(order=>({id:String(order.id),supplier:String(order.supplier||''),title:String(order.title||''),amount:num(order.amount),neededBy:String(order.neededBy||''),status:['Brouillon','Envoyé','Reçu','Annulé'].includes(String(order.status))?order.status as PurchaseOrder['status']:'Brouillon'})):[],
  changeOrders:Array.isArray(source.changeOrders)?source.changeOrders.map(change=>({id:String(change.id),title:String(change.title||''),amount:num(change.amount),days:num(change.days),status:['Brouillon','À approuver','Approuvée','Refusée'].includes(String(change.status))?change.status as ChangeOrder['status']:'Brouillon'})):[],
  dailyLogs:Array.isArray(source.dailyLogs)?source.dailyLogs.map(log=>({id:String(log.id),date:String(log.date||''),summary:String(log.summary||''),blockers:String(log.blockers||'')})):[],
  timesheets:Array.isArray(source.timesheets)?source.timesheets.map(sheet=>({id:String(sheet.id),date:String(sheet.date||''),person:String(sheet.person||''),hours:num(sheet.hours),hourlyRate:num(sheet.hourlyRate),status:['Brouillon','Soumise','Approuvée'].includes(String(sheet.status))?sheet.status as Timesheet['status']:'Brouillon'})):[]
 };
}
export function operationTotals(value:ProjectOperations){
 const planned=round(value.budget.reduce((sum,line)=>sum+line.budget,0));
 const actual=round(value.budget.reduce((sum,line)=>sum+line.actual,0));
 const committed=round(value.purchaseOrders.filter(order=>order.status!=='Annulé').reduce((sum,order)=>sum+order.amount,0));
 const requested=round(value.priceRequests.filter(request=>!['Annulée','Attribuée'].includes(request.status)).reduce((sum,request)=>sum+request.amount,0));
 const approvedChanges=round(value.changeOrders.filter(change=>change.status==='Approuvée').reduce((sum,change)=>sum+change.amount,0));
 const hours=round(value.timesheets.reduce((sum,sheet)=>sum+sheet.hours,0));
 return {planned,actual,committed,requested,approvedChanges,hours,remaining:round(planned-actual-committed)};
}
