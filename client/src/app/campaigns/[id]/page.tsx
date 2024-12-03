'use client'
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FileText } from "lucide-react";
import Editor from "@monaco-editor/react";

const getLanguage = (tab: string) => {
    switch (tab) {
        case 'raw_html':
            return 'html';
        case 'clean_json':
            return 'json';
        case 'jobs_clean_json':
            return 'json';
        // All scripts should use javascript highlighting
        case 'cleanup_script':
        case 'fetch_script':
        case 'jobs_cleanup_script':
        case 'email_gen_script':
        case 'send_emails_script':
            return 'javascript';
        case 'jobs_raw_html':
            return 'html';
        default:
            return 'javascript';
    }
};

const isRunnableFile = (tab: string) => {
    const language = getLanguage(tab);
    return language === 'javascript';
};

const FileItem = ({
    label,
    tab,
    activeTab,
    onClick,
    onRun
}: {
    label: string;
    tab: string;
    activeTab: string;
    onClick: () => void;
    onRun?: (e: React.MouseEvent) => void;
}) => (
    <div
        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${activeTab === tab
            ? 'bg-foreground text-background'
            : 'hover:bg-white hover:bg-opacity-10'
            }`}
        onClick={onClick}
    >
        <FileText className="w-4 h-4" />
        <span>{label}</span>
        {isRunnableFile(tab) && (
            <button
                className="ml-auto px-2 py-1 text-sm bg-foreground text-background rounded"
                onClick={(e) => {
                    e.stopPropagation();
                    onRun?.(e);
                }}
            >
                Run
            </button>
        )}
    </div>
);

interface CampaignData {
    name: string;
    champain_raw_html: string;
    champain_json: any;
    cleanup_script: string;
    fetch_script: string;
    email_generation_script: string;
    jobs_cleanup_script: string;
    send_emails_script: string;
    jobs_raw_html: string;
    jobs_clean_json: any;
    status: string;
}

const Page = () => {
    const params = useParams<{ id: string }>();
    const [campaignData, setCampaignData] = useState<CampaignData | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState<
        'raw_html' |
        'cleanup_script' |
        'clean_json' |
        'fetch_script' |
        'jobs_raw_html' |
        'jobs_cleanup_script' |
        'jobs_clean_json' |
        'email_gen_script' |
        'send_emails_script'
    >('raw_html');
    const [editedData, setEditedData] = useState<{ name: string; champain_raw_html: string }>({
        name: '',
        champain_raw_html: ''
    });
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [isEditorReadOnly, setIsEditorReadOnly] = useState(true);

    useEffect(() => {
        fetch(`http://localhost:3000/campaigns/${params.id}`)
            .then((res) => res.json())
            .then((data) => {
                setCampaignData(data);
                setEditedData({
                    name: data.name,
                    champain_raw_html: data.champain_raw_html
                });
            });
    }, [params.id]);

    const handleRunCleanup = async () => {
        try {
            await fetch(`http://localhost:3000/campaigns/${params.id}/cleanup`, {
                method: 'POST'
            });
            // Refresh campaign data after cleanup
            const res = await fetch(`http://localhost:3000/campaigns/${params.id}`);
            const updatedData = await res.json();
            setCampaignData(updatedData);
        } catch (error) {
            console.error('Error running cleanup:', error);
        }
    };

    const handleRunFetch = async () => {
        try {
            await fetch(`http://localhost:3000/campaigns/${params.id}/fetch`, {
                method: 'POST'
            });
            // Refresh campaign data after fetch
            const res = await fetch(`http://localhost:3000/campaigns/${params.id}`);
            const updatedData = await res.json();
            setCampaignData(updatedData);
        } catch (error) {
            console.error('Error running fetch:', error);
        }
    };

    const handleDeleteClick = async () => {
        if (!window.confirm('Are you sure you want to delete this campaign?')) return;

        try {
            await fetch(`http://localhost:3000/campaigns/${params.id}`, {
                method: 'DELETE'
            });
            router.push('/'); // Redirect to home after deletion
        } catch (error) {
            console.error('Error deleting campaign:', error);
        }
    };

    const handleSave = async (value: string | undefined) => {
        if (!value || !campaignData) return;

        setIsSaving(true);
        try {
            const updatedData = {
                ...campaignData,
                ...(activeTab === 'raw_html' && { champain_raw_html: value }),
                ...(activeTab === 'cleanup_script' && { cleanup_script: value }),
                ...(activeTab === 'clean_json' && { champain_json: JSON.parse(value) }),
                ...(activeTab === 'fetch_script' && { fetch_script: value }),
                ...(activeTab === 'jobs_raw_html' && { jobs_raw_html: value }),
                ...(activeTab === 'jobs_cleanup_script' && { jobs_cleanup_script: value }),
                ...(activeTab === 'jobs_clean_json' && { jobs_clean_json: JSON.parse(value) }),
                ...(activeTab === 'email_gen_script' && { email_generation_script: value }),
                ...(activeTab === 'send_emails_script' && { send_emails_script: value }),
            };

            const response = await fetch(`http://localhost:3000/campaigns/${params.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedData)
            });

            if (!response.ok) {
                throw new Error('Failed to save changes');
            }

            const savedData = await response.json();
            setCampaignData(savedData);
            setIsEditorReadOnly(true);
        } catch (error) {
            console.error('Error saving campaign:', error);
            alert('Failed to save changes. Please check the console for details.');
        } finally {
            setIsSaving(false);
        }
    };

    const getContent = (tab: string) => {
        switch (tab) {
            case 'raw_html':
                return campaignData?.champain_raw_html || 'No raw HTML available';
            case 'cleanup_script':
                return campaignData?.cleanup_script || '// Cleanup script for campaign raw HTML';
            case 'clean_json':
                return JSON.stringify(campaignData?.champain_json, null, 2) || 'No JSON data available';
            case 'fetch_script':
                return campaignData?.fetch_script || '// Script to fetch jobs info';
            case 'jobs_raw_html':
                return campaignData?.jobs_raw_html || 'No jobs raw HTML available';
            case 'jobs_cleanup_script':
                return campaignData?.jobs_cleanup_script || '// Cleanup script for jobs raw HTML';
            case 'jobs_clean_json':
                return JSON.stringify(campaignData?.jobs_clean_json, null, 2) || 'No jobs JSON data available';
            case 'email_gen_script':
                return campaignData?.email_generation_script || '// Email generation script';
            case 'send_emails_script':
                return campaignData?.send_emails_script || '// Script to send emails';
            default:
                return '';
        }
    };

    if (!campaignData) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex flex-col max-w-screen-2xl px-6 pt-6 m-auto min-h-screen font-[family-name:var(--font-geist-sans)]">
            {/* Campaign Header */}
            <div className="flex w-full justify-between items-center mb-8">
                <h1 className="text-4xl w-full font-bold text-center">{campaignData.name}</h1>
                {/* <div className="flex gap-4">
                    <span className="px-4 py-2 bg-foreground text-background rounded-lg">
                        Status: {campaignData.status}
                    </span>
                    <button
                        className="border border-foreground bg-foreground text-background rounded-lg px-4 py-2 hover:bg-background hover:text-foreground"
                        onClick={handleSave}
                    >
                        Save
                    </button>
                    <button
                        className="border border-foreground bg-foreground text-background rounded-lg px-4 py-2 hover:bg-background hover:text-foreground"
                        onClick={() => setIsEditing(true)}
                    >
                        <Pencil className="w-5 h-5" />
                    </button>
                </div> */}
            </div>

            {/* Split View Container */}
            <div className="flex gap-6 h-[calc(100vh-200px)]">
                {/* Left Side - File List and Actions */}
                <div className="w-1/3 bg-white bg-opacity-10 border border-white rounded-lg p-6 backdrop-blur-sm">
                    <div className="flex flex-col gap-4">
                        {/* Campaign Processing */}
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold mb-2 text-gray-400">Campaign Processing</h3>
                            <div className="space-y-2">
                                <FileItem
                                    label="Raw HTML"
                                    tab="raw_html"
                                    activeTab={activeTab}
                                    onClick={() => setActiveTab('raw_html')}
                                />
                                <FileItem
                                    label="Clean up script"
                                    tab="cleanup_script"
                                    activeTab={activeTab}
                                    onClick={() => setActiveTab('cleanup_script')}
                                    onRun={handleRunCleanup}
                                />
                                <FileItem
                                    label="Clean JSON"
                                    tab="clean_json"
                                    activeTab={activeTab}
                                    onClick={() => setActiveTab('clean_json')}
                                />
                            </div>
                        </div>

                        {/* Jobs Processing */}
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold mb-2 text-gray-400">Jobs Processing</h3>
                            <div className="space-y-2">
                                <FileItem
                                    label="Fetch Jobs Script"
                                    tab="fetch_script"
                                    activeTab={activeTab}
                                    onClick={() => setActiveTab('fetch_script')}
                                    onRun={handleRunFetch}
                                />
                                <FileItem
                                    label="Jobs Raw HTML"
                                    tab="jobs_raw_html"
                                    activeTab={activeTab}
                                    onClick={() => setActiveTab('jobs_raw_html')}
                                />
                                <FileItem
                                    label="Jobs Clean up Script"
                                    tab="jobs_cleanup_script"
                                    activeTab={activeTab}
                                    onClick={() => setActiveTab('jobs_cleanup_script')}
                                    onRun={handleRunCleanup}
                                />
                                <FileItem
                                    label="Jobs Clean JSON"
                                    tab="jobs_clean_json"
                                    activeTab={activeTab}
                                    onClick={() => setActiveTab('jobs_clean_json')}
                                />
                            </div>
                        </div>

                        {/* Email Processing */}
                        <div>
                            <h3 className="text-sm font-semibold mb-2 text-gray-400">Email Processing</h3>
                            <div className="space-y-2">
                                <FileItem
                                    label="Email Generation Script"
                                    tab="email_gen_script"
                                    activeTab={activeTab}
                                    onClick={() => setActiveTab('email_gen_script')}
                                    onRun={() => {
                                        // Add email generation run handler here
                                        console.log('Running email generation script');
                                    }}
                                />
                                <FileItem
                                    label="Send Emails Script"
                                    tab="send_emails_script"
                                    activeTab={activeTab}
                                    onClick={() => setActiveTab('send_emails_script')}
                                    onRun={() => setActiveTab('send_emails_script')}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Code Editor View */}
                <div className="w-2/3 bg-white bg-opacity-10 border border-white rounded-lg backdrop-blur-sm overflow-hidden flex flex-col">
                    {/* File Header */}
                    <div className="px-4 py-2 bg-foreground text-background font-mono text-sm flex justify-between items-center">
                        <span>
                            {activeTab === 'raw_html' && 'raw_html.html'}
                            {activeTab === 'cleanup_script' && 'cleanup_script.js'}
                            {activeTab === 'clean_json' && 'campaign_data.json'}
                            {activeTab === 'fetch_script' && 'fetch_script.js'}
                            {activeTab === 'jobs_raw_html' && 'jobs_raw_html.html'}
                            {activeTab === 'jobs_cleanup_script' && 'jobs_cleanup_script.js'}
                            {activeTab === 'jobs_clean_json' && 'jobs_clean_json.json'}
                            {activeTab === 'email_gen_script' && 'email_gen_script.js'}
                            {activeTab === 'send_emails_script' && 'send_emails_script.js'}
                        </span>
                        <button
                            className="px-2 py-1 text-xs border border-background rounded hover:bg-background hover:text-foreground"
                            onClick={() => {
                                if (isEditorReadOnly) {
                                    setIsEditorReadOnly(false);
                                } else {
                                    // @ts-expect-error monaco is not defined in the global scope
                                    const editor = window.monaco?.editor.getModels()[0];
                                    handleSave(editor?.getValue());
                                }
                            }}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <span className="inline-block animate-spin">⟳</span>
                            ) : isEditorReadOnly ? (
                                'Edit'
                            ) : (
                                'Save'
                            )}
                        </button>
                    </div>
                    {/* Code Content */}
                    <div className="flex-1 overflow-hidden font-mono text-sm bg-background">
                        <Editor
                            height="100%"
                            language={getLanguage(activeTab)}
                            value={getContent(activeTab)}
                            theme="vs-dark"
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                wordWrap: 'on',
                                lineNumbers: 'on',
                                renderWhitespace: 'selection',
                                readOnly: isEditorReadOnly
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-background p-8 rounded-lg w-2/4">
                        <h2 className="text-2xl font-bold mb-4">Edit Campaign</h2>
                        <div className="mb-4">
                            <label className="block text-sm font-bold mb-2">Name</label>
                            <input
                                type="text"
                                value={editedData.name}
                                onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
                                className="w-full p-2 border rounded-lg bg-background"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-bold mb-2">Raw HTML</label>
                            <textarea
                                value={editedData.champain_raw_html}
                                onChange={(e) => setEditedData({ ...editedData, champain_raw_html: e.target.value })}
                                className="w-full p-2 border rounded-lg bg-background"
                                rows={10}
                            />
                        </div>
                        <div className="flex justify-end gap-4">
                            <button
                                className="px-4 py-2 bg-background border border-foreground text-foreground rounded-lg"
                                onClick={() => setIsEditing(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-foreground text-background rounded-lg"
                                onClick={() => {
                                    // Handle save logic here
                                    setIsEditing(false);
                                }}
                            >
                                Save
                            </button>
                        </div>

                        {/* Danger Zone */}
                        <div className="w-full border-t border-gray-300 pt-4">
                            <h3 className="text-center text-lg font-bold mb-2 text-red-500">Danger Zone</h3>
                            <button
                                className="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                                onClick={handleDeleteClick}
                            >
                                Delete Campaign
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Page;

