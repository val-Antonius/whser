import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock } from "lucide-react";

interface OrderJob {
    id: number;
    job_name: string;
    job_order: number;
    status: string;
    estimated_duration_minutes: number;
    started_at?: string;
    completed_at?: string;
}

interface ProcessJobListProps {
    jobs: OrderJob[];
}

export function ProcessJobList({ jobs }: ProcessJobListProps) {
    if (!jobs || jobs.length === 0) {
        return null; // Don't render if no jobs
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: "bg-gray-100 text-gray-800",
            ready: "bg-blue-100 text-blue-800",
            in_progress: "bg-purple-100 text-purple-800",
            completed: "bg-green-100 text-green-800",
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    const getStepIcon = (status: string) => {
        if (status === 'completed') return <CheckCircle2 className="w-5 h-5 text-green-600" />;
        if (status === 'in_progress') return <Clock className="w-5 h-5 text-purple-600 animate-pulse" />;
        return <Circle className="w-5 h-5 text-gray-300" />;
    };

    return (
        <Card className="bg-white shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="text-lg font-semibold text-gray-900 flex justify-between items-center">
                    <span>Workflow Progress</span>
                    <Badge variant="outline" className="font-normal text-xs">
                        {jobs.filter(j => j.status === 'completed').length} / {jobs.length} Steps
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                    {jobs.map((job) => (
                        <div key={job.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                            <div className="flex-shrink-0">
                                {getStepIcon(job.status)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <p className="font-medium text-gray-900 text-sm truncate">
                                        {job.job_order}. {job.job_name}
                                    </p>
                                    <Badge className={`text-[10px] px-1.5 py-0 ${getStatusColor(job.status)} border-0`}>
                                        {job.status.toUpperCase()}
                                    </Badge>
                                </div>

                                <div className="flex items-center mt-1 text-xs text-gray-500 gap-3">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {job.estimated_duration_minutes}m
                                    </span>
                                    {job.started_at && (
                                        <span>Started: {new Date(job.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
