import axios from 'axios';

const baseURL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, "");

export const api = {
    analyzeJD: async (text: string) => {
        const res = await axios.post(`${baseURL}/analyze-jd`, { text });
        return res.data;
    },
    
    uploadBatch: async (jdText: string, candidates: { name: string, email: string, github_username: string, file: File }[]) => {
        const formData = new FormData();
        formData.append('jd_text', jdText);
        
        candidates.forEach(c => {
            formData.append('names', c.name);
            formData.append('emails', c.email || '');
            formData.append('githubs', c.github_username || '');
            formData.append('files', c.file);
        });
        
        const res = await axios.post(`${baseURL}/upload-batch`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    },

    getJobStatus: async (jobId: string) => {
        const res = await axios.get(`${baseURL}/status/${jobId}`);
        return res.data;
    },

    getJobDashboard: async (jobId: string) => {
        const res = await axios.get(`${baseURL}/dashboard/${jobId}`);
        return res.data;
    },

    compareCandidates: async (candidates: any[], jdAnalysis: any) => {
        const res = await axios.post(`${baseURL}/compare-candidates`, {
            candidates,
            jd_analysis: jdAnalysis
        });
        return res.data;
    },
    
    sendEmails: async (selected: { name: string, email: string }[]) => {
        const res = await axios.post(`${baseURL}/send-emails`, {
            selected_candidates: selected
        });
        return res.data;
    }
}
