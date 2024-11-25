import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Campaign {
    name: string;
    status: string;
    activeJobs: number;
}

const CampaignItemContainer: React.FC = () => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const response = await axios.get('http://localhost:3000/campaigns');
                setCampaigns(response.data);
            } catch (error) {
                console.error('Error fetching campaigns:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCampaigns();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (campaigns.length === 0) {
        return <div>No active campaigns</div>;
    }

    return (
        <div className="w-full flex flex-wrap gap-4 mt-6 justify-start items-start">
            {campaigns.map((campaign) => (
                <div
                    key={campaign.name}
                    className="bg-white bg-opacity-10 border border-white rounded-lg p-4 w-64 backdrop-blur-sm shadow-md transition-transform transform hover:scale-105"
                >
                    <h2 className="text-xl font-semibold mb-2">{campaign.name}</h2>
                    <p className="text-sm">Status: {campaign.status}</p>
                    <p className="text-sm">Active Jobs: {campaign.activeJobs}</p>
                </div>
            ))}
        </div>
    );
};

export default CampaignItemContainer;