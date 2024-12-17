'use client'

import React, { useState } from 'react';
import axios from 'axios';
import CampaignItemContainer from "@/components/CampaignItemContainer";

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [rawHtml, setRawHtml] = useState('');

  const handleSave = async () => {
    try {
      await axios.post('http://localhost:3000/campaigns', { name, champain_raw_html: rawHtml });
      setShowModal(false);
      setName('');
      setRawHtml('');
      // Optionally, refresh the campaigns list here
    } catch (error) {
      console.error('Error saving campaign:', error);
    }
  };

  return (
    <div className="flex flex-col max-w-screen-2xl px-6 pt-6 m-auto items-center justify-items-center min-h-screen font-[family-name:var(--font-geist-sans)]">
      <div className="flex w-full align-middle items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-center text-foreground block">jaas</h1>
        <button
          className="border border-foreground bg-foreground text-background text-md font-semibold rounded-lg px-4 py-2 hover:bg-background hover:text-foreground"
          onClick={() => setShowModal(true)}
        >
          Create a Campaign
        </button>
      </div>

      <CampaignItemContainer />

      {showModal && (
        <div className="fixed  inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="md:w-2/4 sm:w-full m-auto border border-foreground bg-background p-6 rounded-lg">
            <h2 className="text-2xl mb-4">Create Campaign</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm bg-background p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground">Raw HTML</label>
              <textarea
                value={rawHtml}
                onChange={(e) => setRawHtml(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm bg-background p-2"
                rows={4}
              />
            </div>
            <div className="flex justify-end">
              <button
                className=" mr-2 px-4 py-2 bg-background border border-foreground w-1/2 rounded-lg"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
              <button
                className="px-4 py-2 w-1/2 text-background bg-foreground border border-foreground rounded-lg"
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
