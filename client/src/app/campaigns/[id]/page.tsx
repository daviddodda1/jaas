'use client'
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FileText, ChevronDown, ChevronUp } from "lucide-react";
import Editor from "@monaco-editor/react";

const getLanguage = (tab: string) => {
    switch (tab) {
        // HTML files
        case 'raw_html':
        case 'jobs_raw_html':
            return 'json';

        // JSON files
        case 'clean_json':
        case 'jobs_clean_json':
        case 'generated_emails_json':
            return 'json';

        // JavaScript files (scripts)
        case 'cleanup_script':
        case 'fetch_script':
        case 'jobs_cleanup_script':
        case 'email_gen_script':
        case 'send_emails_script':
            return 'javascript';

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
    onRun,
    isRunning = false,
    isAnyScriptRunning = false,
}: {
    label: string;
    tab: string;
    activeTab: string;
    onClick: () => void;
    onRun?: (e: React.MouseEvent) => void;
    isRunning?: boolean;
    isAnyScriptRunning?: boolean;
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
                className={`ml-auto px-2 py-1 text-sm ${isRunning || isAnyScriptRunning ? 'bg-gray-500' : 'bg-foreground'
                    } text-background rounded`}
                onClick={(e) => {
                    e.stopPropagation();
                    if (!isRunning && !isAnyScriptRunning) {
                        onRun?.(e);
                    }
                }}
                disabled={isRunning || isAnyScriptRunning}
            >
                {isRunning ? 'Running...' : isAnyScriptRunning ? 'Waiting...' : 'Run'}
            </button>
        )}
    </div>
);

interface CampaignData {
    name: string;
    champain_raw_html: string;
    champain_json: string;
    cleanup_script: string;
    fetch_script: string;
    email_generation_script: string;
    jobs_cleanup_script: string;
    send_emails_script: string;
    jobs_raw_html: string;
    jobs_clean_json: string;
    status: string;
    generated_emails_json: string;
}

interface ScriptLog {
    campaignId: string;
    scriptType: string;
    timestamp: string;
    level: 'info' | 'error' | 'debug';
    message: string;
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
        'generated_emails_json' |
        'send_emails_script'
    >('raw_html');
    const [editedData, setEditedData] = useState<{ name: string; champain_raw_html: string }>({
        name: '',
        champain_raw_html: ''
    });
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [isEditorReadOnly, setIsEditorReadOnly] = useState(true);
    const [isScriptRunning, setIsScriptRunning] = useState(false);
    const [scriptLogs, setScriptLogs] = useState<ScriptLog[]>([]);
    const [showLogs, setShowLogs] = useState(false);
    const [isAnyScriptRunning, setIsAnyScriptRunning] = useState(false);

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

    useEffect(() => {
        // Only set up status checking if the current tab is a JavaScript file
        if (!isRunnableFile(activeTab)) {
            // Clear any existing states if we switch to a non-script tab
            setIsScriptRunning(false);
            setIsAnyScriptRunning(false);
            setScriptLogs([]);
            return;
        }

        const checkScriptStatus = async () => {
            try {
                const response = await fetch(`http://localhost:3000/campaigns/${params.id}/script-status`);
                const status = await response.json();
                setIsAnyScriptRunning(status.isRunning || false);

                // Map the active tab to the correct script type for the API
                const scriptType = activeTab === 'email_gen_script' ? 'email_generation_script' :
                    activeTab === 'cleanup_script' ? 'cleanup_script' :
                        activeTab === 'fetch_script' ? 'fetch_script' :
                            activeTab === 'jobs_cleanup_script' ? 'jobs_cleanup_script' :
                                activeTab === 'send_emails_script' ? 'send_emails_script' : null;

                if (scriptType && status.isRunning) {
                    const logsResponse = await fetch(`http://localhost:3000/campaigns/${params.id}/logs/${scriptType}`);
                    if (logsResponse.ok) {
                        const logs = await logsResponse.json();
                        setScriptLogs(logs);

                        // If logs exist and logs panel is closed, open it
                        if (logs.length > 0) {
                            setShowLogs(true);
                        }
                    }

                    // Set isScriptRunning for the active script
                    setIsScriptRunning(status.scriptType === scriptType);
                }

                // Clear running states if no script is running
                if (!status.isRunning) {
                    setIsScriptRunning(false);
                    setIsAnyScriptRunning(false);
                }
            } catch (error) {
                console.error('Error checking script status:', error);
            }
        };

        // Check immediately
        checkScriptStatus();

        // Set up polling interval only for script files
        const interval = setInterval(checkScriptStatus, 1000);

        // Cleanup
        return () => clearInterval(interval);
    }, [params.id, activeTab]);

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
            // Map active tab to the corresponding field name
            const fieldName = activeTab === 'raw_html' ? 'champain_raw_html' :
                activeTab === 'clean_json' ? 'champain_json' :
                    activeTab === 'cleanup_script' ? 'cleanup_script' :
                        activeTab === 'fetch_script' ? 'fetch_script' :
                            activeTab === 'jobs_raw_html' ? 'jobs_raw_html' :
                                activeTab === 'jobs_cleanup_script' ? 'jobs_cleanup_script' :
                                    activeTab === 'jobs_clean_json' ? 'jobs_clean_json' :
                                        activeTab === 'email_gen_script' ? 'email_generation_script' :
                                            activeTab === 'generated_emails_json' ? 'generated_emails_json' :
                                                activeTab === 'send_emails_script' ? 'send_emails_script' :
                                                    activeTab;

            // Only update the field corresponding to the active tab
            const updateData = {
                [fieldName]: value
            };

            const response = await fetch(`http://localhost:3000/campaigns/${params.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
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
                return campaignData?.champain_json || '{}';
            case 'fetch_script':
                return campaignData?.fetch_script || '// Script to fetch jobs info';
            case 'jobs_raw_html':
                return campaignData?.jobs_raw_html || 'No jobs raw HTML available';
            case 'jobs_cleanup_script':
                return campaignData?.jobs_cleanup_script || '// Cleanup script for jobs raw HTML';
            case 'jobs_clean_json':
                return campaignData?.jobs_clean_json || '{}';
            case 'email_gen_script':
                return campaignData?.email_generation_script || '// Email generation script';
            case 'generated_emails_json':
                return campaignData?.generated_emails_json || '{}';
            case 'send_emails_script':
                return campaignData?.send_emails_script || '// Script to send emails';
            default:
                return '';
        }
    };

    const saveCurrentFile = async () => {
        if (!isEditorReadOnly) {
            // @ts-expect-error monaco is not defined in the global scope
            const editor = window.monaco?.editor.getModels()[0];
            const value = editor?.getValue();
            if (value) {
                await handleSave(value);
            }
        }
    };

    const handleTabSwitch = async (newTab: typeof activeTab) => {
        try {
            // Save current file if it's in edit mode
            await saveCurrentFile();

            // Fetch latest campaign data before switching tabs
            const campaignResponse = await fetch(`http://localhost:3000/campaigns/${params.id}`);
            if (!campaignResponse.ok) {
                throw new Error('Failed to fetch latest campaign data');
            }
            const updatedCampaignData = await campaignResponse.json();
            setCampaignData(updatedCampaignData);

            // Switch to new tab and reset editor state
            setActiveTab(newTab);
            setIsEditorReadOnly(true);

            // If switching to a script file, fetch its previous logs
            if (isRunnableFile(newTab)) {
                const scriptType = newTab === 'email_gen_script' ? 'email_generation_script' :
                    newTab === 'cleanup_script' ? 'cleanup_script' :
                        newTab === 'fetch_script' ? 'fetch_script' :
                            newTab === 'jobs_cleanup_script' ? 'jobs_cleanup_script' :
                                newTab === 'send_emails_script' ? 'send_emails_script' : null;

                if (scriptType) {
                    const logsResponse = await fetch(`http://localhost:3000/campaigns/${params.id}/logs/${scriptType}`);
                    if (!logsResponse.ok) {
                        throw new Error('Failed to fetch logs');
                    }
                    const logs = await logsResponse.json();
                    setScriptLogs(logs);

                    // Automatically show logs if there are any
                    if (logs.length > 0) {
                        setShowLogs(true);
                    }
                }
            } else {
                // Clear logs when switching to non-script files
                setScriptLogs([]);
                setShowLogs(false);
            }
        } catch (error) {
            console.error('Error switching tabs:', error);
            alert('Failed to switch tabs. Please try again.');
        }
    };

    const handleRunScript = async (scriptType: string) => {
        try {
            // Check status before running
            const statusResponse = await fetch(`http://localhost:3000/campaigns/${params.id}/script-status`);
            const status = await statusResponse.json();

            if (status.isRunning) {
                alert('Another script is currently running. Please wait.');
                return;
            }

            // Map the file tab name to the correct script type for the API
            const apiScriptType = scriptType === 'fetch_script' ? 'fetch_script' :
                scriptType === 'cleanup_script' ? 'cleanup_script' :
                    scriptType === 'jobs_cleanup_script' ? 'jobs_cleanup_script' :
                        scriptType === 'email_gen_script' ? 'email_generation_script' :
                            scriptType === 'send_emails_script' ? 'send_emails_script' :
                                scriptType;

            setIsScriptRunning(true);
            setIsAnyScriptRunning(true);
            const response = await fetch(`http://localhost:3000/campaigns/${params.id}/execute/${apiScriptType}`, {
                method: 'POST'
            });

            if (!response.ok) {
                const error = await response.json();
                alert(error.message);
                return;
            }

            // Start polling for logs
            pollLogs(apiScriptType);
        } catch (error) {
            console.error('Error running script:', error);
            alert('Failed to run script');
            setIsScriptRunning(false);
            setIsAnyScriptRunning(false);
        }
    };

    const pollLogs = async (scriptType: string) => {
        const pollInterval = setInterval(async () => {
            try {
                // Get script status
                const statusResponse = await fetch(`http://localhost:3000/campaigns/${params.id}/script-status`);
                const status = await statusResponse.json();

                // Get latest logs with the correct script type
                const logsResponse = await fetch(`http://localhost:3000/campaigns/${params.id}/logs/${scriptType}`);
                if (!logsResponse.ok) {
                    throw new Error('Failed to fetch logs');
                }
                const logs = await logsResponse.json();
                setScriptLogs(logs);

                // If script is no longer running, clean up
                if (!status.isRunning) {
                    setIsScriptRunning(false);
                    setIsAnyScriptRunning(false);
                    clearInterval(pollInterval);

                    // Refresh campaign data
                    const campaignResponse = await fetch(`http://localhost:3000/campaigns/${params.id}`);
                    const campaignData = await campaignResponse.json();
                    setCampaignData(campaignData);
                }
            } catch (error) {
                console.error('Error polling logs:', error);
                clearInterval(pollInterval);
                setIsScriptRunning(false);
                setIsAnyScriptRunning(false);
            }
        }, 2000);

        return () => clearInterval(pollInterval);
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
                                    onClick={() => handleTabSwitch('raw_html')}
                                />
                                <FileItem
                                    label="Clean up script"
                                    tab="cleanup_script"
                                    activeTab={activeTab}
                                    onClick={() => handleTabSwitch('cleanup_script')}
                                    onRun={() => handleRunScript('cleanup_script')}
                                    isRunning={isScriptRunning && activeTab === 'cleanup_script'}
                                    isAnyScriptRunning={isAnyScriptRunning}
                                />
                                <FileItem
                                    label="Clean JSON"
                                    tab="clean_json"
                                    activeTab={activeTab}
                                    onClick={() => handleTabSwitch('clean_json')}
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
                                    onClick={() => handleTabSwitch('fetch_script')}
                                    onRun={() => handleRunScript('fetch_script')}
                                    isRunning={isScriptRunning && activeTab === 'fetch_script'}
                                    isAnyScriptRunning={isAnyScriptRunning}
                                />
                                <FileItem
                                    label="Jobs Raw HTML"
                                    tab="jobs_raw_html"
                                    activeTab={activeTab}
                                    onClick={() => handleTabSwitch('jobs_raw_html')}
                                />
                                <FileItem
                                    label="Jobs Clean up Script"
                                    tab="jobs_cleanup_script"
                                    activeTab={activeTab}
                                    onClick={() => handleTabSwitch('jobs_cleanup_script')}
                                    onRun={() => handleRunScript('jobs_cleanup_script')}
                                    isRunning={isScriptRunning && activeTab === 'jobs_cleanup_script'}
                                    isAnyScriptRunning={isAnyScriptRunning}
                                />
                                <FileItem
                                    label="Jobs Clean JSON"
                                    tab="jobs_clean_json"
                                    activeTab={activeTab}
                                    onClick={() => handleTabSwitch('jobs_clean_json')}
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
                                    onClick={() => handleTabSwitch('email_gen_script')}
                                    onRun={() => handleRunScript('email_gen_script')}
                                    isRunning={isScriptRunning && activeTab === 'email_gen_script'}
                                    isAnyScriptRunning={isAnyScriptRunning}
                                />
                                <FileItem
                                    label="Generated Emails JSON"
                                    tab="generated_emails_json"
                                    activeTab={activeTab}
                                    onClick={() => handleTabSwitch('generated_emails_json')}
                                />

                                <FileItem
                                    label="Send Emails Script"
                                    tab="send_emails_script"
                                    activeTab={activeTab}
                                    onClick={() => handleTabSwitch('send_emails_script')}
                                    onRun={() => handleTabSwitch('send_emails_script')}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Code Editor View */}
                <div className="w-2/3 flex flex-col gap-2">
                    {/* Code Editor Container */}
                    <div className={`bg-white bg-opacity-10 border border-white rounded-lg backdrop-blur-sm overflow-hidden flex flex-col ${showLogs && isRunnableFile(activeTab) ? 'h-2/3' : 'flex-1'}`}>
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
                                {activeTab === 'generated_emails_json' && 'generated_emails_json.json'}
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

                    {/* Logs Container - Only visible for JavaScript files */}
                    {isRunnableFile(activeTab) && (
                        <div className={`bg-white bg-opacity-10 border border-white rounded-lg backdrop-blur-sm overflow-hidden flex flex-col ${showLogs ? 'flex-1' : 'h-12'}`}>
                            <div className="px-4 py-2 bg-foreground text-background font-mono text-sm flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span>Execution Logs</span>
                                    {isScriptRunning && (
                                        <span className="text-xs px-2 py-1 bg-yellow-500 rounded">Running...</span>
                                    )}
                                </div>
                                <button
                                    className="px-2 py-1 text-xs border border-background rounded hover:bg-background hover:text-foreground flex items-center gap-1"
                                    onClick={() => setShowLogs(!showLogs)}
                                >
                                    {showLogs ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                                    {showLogs ? 'Collapse' : 'Expand'}
                                </button>
                            </div>
                            {showLogs && (
                                <div className="flex-1 overflow-auto bg-background p-4 font-mono text-sm">
                                    {scriptLogs.length === 0 ? (
                                        <div className="text-gray-500 italic">No logs available</div>
                                    ) : (
                                        scriptLogs.map((log, index) => (
                                            <div
                                                key={index}
                                                className={`whitespace-pre-wrap mb-1 border-b border-gray-800 pb-1 ${log.level === 'error' ? 'text-red-400' :
                                                    log.level === 'debug' ? 'text-yellow-400' :
                                                        'text-gray-200'
                                                    }`}
                                            >
                                                <span className="text-xs text-gray-500">
                                                    {new Date(log.timestamp).toLocaleTimeString()} [{log.level.toUpperCase()}]
                                                </span>
                                                <span className="ml-2">{log.message}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    )}
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

