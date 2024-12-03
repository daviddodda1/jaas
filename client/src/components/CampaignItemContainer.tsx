'use client'

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
interface Campaign {
    name: string;
    status: string;
    champain_json: [];
    id: string;
}

const CampaignItemContainer: React.FC = () => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

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

    function handleClick(campaign: Campaign) {
        router.push(`/campaigns/${campaign.id}`);
    }

    return (
        <div className="w-full flex flex-wrap gap-4 mt-6 justify-start items-start">
            {campaigns.map((campaign) => (
                <div
                    key={campaign.name}
                    className="bg-white bg-opacity-10 border border-white rounded-lg p-4 w-80 backdrop-blur-sm shadow-md transition-transform transform hover:scale-105 cursor-pointer"
                    onClick={() => handleClick(campaign)}
                >
                    <h2 className="text-xl font-semibold mb-2">{campaign.name}</h2>
                    <p className="text-sm flex w-full justify-between items-center pt-4"> <span className='block'>Status: {campaign.status}</span> <span className='block p-4 bg-background rounded-lg font-bold w-1/2'> Jobs: {campaign?.champain_json?.length || 0}</span> </p>

                </div>
            ))}
        </div>
    );
};

export default CampaignItemContainer;