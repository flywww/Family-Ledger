export const LOGIN_PATH = '/login';
export const AUTHENTICATED_LANDING_PATH = '/dashboard';
export const SIGN_OUT_REDIRECT_PATH = LOGIN_PATH;

const PROTECTED_APP_ROUTE_PREFIXES = [
    AUTHENTICATED_LANDING_PATH,
    '/balance',
    '/setting',
] as const;

const INFRASTRUCTURE_ROUTE_PREFIXES = [
    '/api',
    '/_next/static',
    '/_next/image',
] as const;

function isPathAtOrBelow(pathname: string, prefix: string) {
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isProtectedAppRoute(pathname: string) {
    return PROTECTED_APP_ROUTE_PREFIXES.some((prefix) => isPathAtOrBelow(pathname, prefix));
}

export function isInfrastructureRoute(pathname: string) {
    return INFRASTRUCTURE_ROUTE_PREFIXES.some((prefix) => isPathAtOrBelow(pathname, prefix))
        || pathname.endsWith('.png');
}

export function getAuthorizedRouteDecision({
    isLoggedIn,
    nextUrl,
}: {
    isLoggedIn: boolean;
    nextUrl: URL;
}) {
    const pathname = nextUrl.pathname;

    if (isInfrastructureRoute(pathname)) {
        return true;
    }

    if (isPathAtOrBelow(pathname, LOGIN_PATH)) {
        if (isLoggedIn) {
            return Response.redirect(new URL(AUTHENTICATED_LANDING_PATH, nextUrl));
        }
        return true;
    }

    if (pathname === '/') {
        return Response.redirect(
            new URL(isLoggedIn ? AUTHENTICATED_LANDING_PATH : LOGIN_PATH, nextUrl),
        );
    }

    if (isProtectedAppRoute(pathname)) {
        return isLoggedIn;
    }

    return true;
}
