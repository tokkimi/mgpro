import {NextResponse,NextRequest} from 'next/server';
export function proxy(request:NextRequest){const headers=new Headers(request.headers);headers.set('x-site-locale',request.nextUrl.pathname==='/en'||request.nextUrl.pathname.startsWith('/en/')?'en-CA':'fr-CA');return NextResponse.next({request:{headers}})}
export const config={matcher:['/((?!api|_next|.*\\..*).*)']};
