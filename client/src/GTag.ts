import ReactGA from 'react-ga4';

export default class GTag {
    public static initialize() {
        const path = document.location.pathname;
        if (path.includes('jsonlogs')) {
            ReactGA.initialize('G-K9M5MG60BK');
        } else if (path.includes('json-log-viewer') || path.includes('jlogviewer')) {
            ReactGA.initialize('G-LXBMLPXTGQ');
        } else if (path.includes('mitmproxy')) {
            ReactGA.initialize('G-JBBB8K7GRR');
        } else {
            ReactGA.initialize('G-H1NDQRZW8J');
        }
    }

    public static pageView(title: string) {
        ReactGA.event('page_view', {
            page_title: title
        });
    }

    public static search(searchTerm: string) {
        ReactGA.event('search', {
            search_term: searchTerm
        });
    }

    public static exception(description: string, fatal: boolean) {
        ReactGA.event('exception', {
            description, fatal
        });
    }

    public static selectContent(type: string, id: string) {
        ReactGA.event('select_content', {
            content_type: type,
            content_id: id
        });
    }

    public static selectItem(name: string, value: string) {
        ReactGA.event('select_item', {
            item_list_name: name,
            items: [value]
        });
    }
}