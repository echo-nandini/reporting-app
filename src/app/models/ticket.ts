export class Ticket {
    id: number;
    issueType: string; 
    key: string;
    reporter: string;
    assignee: string;
    priority: string; 
    status: string;
    resolution: string;
    created: Date;
    updated: Date;
    changePriority: string;
    components: string;
    faultPriority: string;
    issuePriority: string;
    appName: string;
    defectPriority: string;
    servicePriority: string;
    withinKPI?: boolean; 
    outsideKPI?: boolean;

    constructor(data?: Partial<Ticket>) {
        this.id = data?.id || 0;
        this.issueType = data?.issueType || '';
        this.key = data?.key || '';
        this.reporter = data?.reporter || '';
        this.assignee = data?.assignee || '';
        this.priority = data?.priority || '';
        this.status = data?.status || '';
        this.resolution = data?.resolution || '';
        this.created = data?.created ? new Date(data.created) : new Date();
        this.updated = data?.updated ? new Date(data.updated) : new Date();
        this.changePriority = data?.changePriority || '';
        this.components = data?.components || '';
        this.faultPriority = data?.faultPriority || '';
        this.issuePriority = data?.issuePriority || '';
        this.appName = data?.appName || '';
        this.defectPriority = data?.defectPriority || '';
        this.servicePriority = data?.servicePriority || '';
    }
}
