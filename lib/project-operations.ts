import {round} from './model';

export type BudgetLine={id:string;name:string;budget:number;actual:number};
export type CostCode={id:string;code:string;name:string;budget:number};
export type ProcurementLine={id:string;description:string;quantity:number;unit:string;price:number;received:number};
export type ProcurementDetails={email?:string;reference?:string;notes?:string;quoteId?:string;lines?:ProcurementLine[];taxRate?:number;deliveryAddress?:string;awardedOrderId?:string};
export type PriceRequest=ProcurementDetails&{id:string;supplier:string;scope:string;dueOn:string;status:'Brouillon'|'Envoyée'|'Réponse reçue'|'Attribuée'|'Annulée';amount:number};
export type PurchaseOrder=ProcurementDetails&{id:string;supplier:string;title:string;amount:number;neededBy:string;status:'Brouillon'|'Envoyé'|'Reçu'|'Annulé'};
export type ChangeOrder={id:string;title:string;amount:number;days:number;status:'Brouillon'|'À approuver'|'Approuvée'|'Refusée'};
export type DailyLog={id:string;date:string;summary:string;blockers:string;sharedWithClient?:boolean};
export type Timesheet={id:string;date:string;person:string;hours:number;hourlyRate:number;status:'Brouillon'|'Soumise'|'Approuvée'};
export function timesheetsForDates(sheets:Timesheet[],dates:string[],person?:string){
 const selected=new Set(dates);
 return sheets.filter(sheet=>selected.has(sheet.date)&&(person===undefined||sheet.person===person));
}
export function approveTimesheets(sheets:Timesheet[],dates:string[],person:string):Timesheet[]{
 const selected=new Set(dates);
 return sheets.map(sheet=>selected.has(sheet.date)&&sheet.person===person?{...sheet,status:'Approuvée'}:sheet);
}
export type ProjectOperations={budget:BudgetLine[];costCodes:CostCode[];priceRequests:PriceRequest[];purchaseOrders:PurchaseOrder[];changeOrders:ChangeOrder[];dailyLogs:DailyLog[];timesheets:Timesheet[]};

export const emptyOperations=():ProjectOperations=>({budget:[],costCodes:[],priceRequests:[],purchaseOrders:[],changeOrders:[],dailyLogs:[],timesheets:[]});
const num=(value:unknown)=>Math.max(0,Number(value)||0);
function details(value:ProcurementDetails):ProcurementDetails{return {email:String(value.email||''),reference:String(value.reference||''),notes:String(value.notes||''),quoteId:String(value.quoteId||''),taxRate:num(value.taxRate),deliveryAddress:String(value.deliveryAddress||''),awardedOrderId:String(value.awardedOrderId||''),lines:Array.isArray(value.lines)?value.lines.map(x=>({id:String(x.id),description:String(x.description||''),quantity:num(x.quantity),unit:String(x.unit||'unité'),price:num(x.price),received:Math.min(num(x.quantity),num(x.received))})):[]}}
export function procurementAmount(lines:ProcurementLine[],taxRate=0){return round(lines.reduce((sum,line)=>sum+round(line.quantity*line.price),0)*(1+Math.max(0,taxRate)/100))}
export function operationsFrom(value:unknown):ProjectOperations{
 const source=value&&typeof value==='object'?value as Partial<ProjectOperations>:{};
 return {
  budget:Array.isArray(source.budget)?source.budget.map(line=>({id:String(line.id),name:String(line.name||'Poste'),budget:num(line.budget),actual:num(line.actual)})):[],
  costCodes:Array.isArray(source.costCodes)?source.costCodes.map(code=>({id:String(code.id),code:String(code.code||''),name:String(code.name||'Poste'),budget:num(code.budget)})):[],
  priceRequests:Array.isArray(source.priceRequests)?source.priceRequests.map(request=>({...details(request),id:String(request.id),supplier:String(request.supplier||''),scope:String(request.scope||''),dueOn:String(request.dueOn||''),status:['Brouillon','Envoyée','Réponse reçue','Attribuée','Annulée'].includes(String(request.status))?request.status as PriceRequest['status']:'Brouillon',amount:num(request.amount)})):[],
  purchaseOrders:Array.isArray(source.purchaseOrders)?source.purchaseOrders.map(order=>({...details(order),id:String(order.id),supplier:String(order.supplier||''),title:String(order.title||''),amount:num(order.amount),neededBy:String(order.neededBy||''),status:['Brouillon','Envoyé','Reçu','Annulé'].includes(String(order.status))?order.status as PurchaseOrder['status']:'Brouillon'})):[],
  changeOrders:Array.isArray(source.changeOrders)?source.changeOrders.map(change=>({id:String(change.id),title:String(change.title||''),amount:num(change.amount),days:num(change.days),status:['Brouillon','À approuver','Approuvée','Refusée'].includes(String(change.status))?change.status as ChangeOrder['status']:'Brouillon'})):[],
  dailyLogs:Array.isArray(source.dailyLogs)?source.dailyLogs.map(log=>({id:String(log.id),date:String(log.date||''),summary:String(log.summary||''),blockers:String(log.blockers||''),sharedWithClient:log.sharedWithClient===true})):[],
  timesheets:Array.isArray(source.timesheets)?source.timesheets.map(sheet=>({id:String(sheet.id),date:String(sheet.date||''),person:String(sheet.person||''),hours:num(sheet.hours),hourlyRate:num(sheet.hourlyRate),status:['Brouillon','Soumise','Approuvée'].includes(String(sheet.status))?sheet.status as Timesheet['status']:'Brouillon'})):[]
 };
}
export function operationTotals(value:ProjectOperations){
 const planned=round(value.budget.reduce((sum,line)=>sum+line.budget,0));
 const actual=round(value.budget.reduce((sum,line)=>sum+line.actual,0));
 const committed=round(value.purchaseOrders.filter(order=>['Envoyé','Reçu'].includes(order.status)).reduce((sum,order)=>sum+order.amount,0));
 const requested=round(value.priceRequests.filter(request=>!['Annulée','Attribuée'].includes(request.status)).reduce((sum,request)=>sum+request.amount,0));
 const approvedChanges=round(value.changeOrders.filter(change=>change.status==='Approuvée').reduce((sum,change)=>sum+change.amount,0));
 const hours=round(value.timesheets.reduce((sum,sheet)=>sum+sheet.hours,0));
 return {planned,actual,committed,requested,approvedChanges,hours,remaining:round(planned-actual-committed)};
}
