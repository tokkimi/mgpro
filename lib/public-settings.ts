import {defaults} from './model';

/** Only information intended for publication may cross the server/client boundary. */
export function publicSettings(raw:Record<string,unknown> | null | undefined){
 const text=(key:'name'|'phone'|'rbq'|'seo_title'|'seo_description')=>{
  const value=raw?.[key];return typeof value==='string' && value.trim() ? value : defaults[key];
 };
 return {name:text('name'),phone:text('phone'),rbq:text('rbq'),seo_title:text('seo_title'),seo_description:text('seo_description')};
}
