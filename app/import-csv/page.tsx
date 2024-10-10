'use client'

import { log } from "console"
import { useState } from "react"

const ImportCsvPage = () => {

    const [file, setFile] = useState<File | null>(null);
    const [message, setMessage] = useState<String>('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setFile(file);
    }

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!file) {
            setMessage('Please select a csv file');
            return;
        }
        
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/import-csv', {
            method: 'POST',
            body: formData,
        });

        const result = await res.json();
        if(result.success){
            setMessage('File import successfully');
        }else{
            setMessage('Error:' + result.error);
        }
    };

    return (
        <div>
            <h1> Import CSV File</h1>
            <form onSubmit={handleFormSubmit}>
                <input type="file" accept=".csv" onChange={handleFileChange} />
                <button type="submit"> Upload </button>
            </form>
            {message && <p> {message} </p>}
        </div>
    )
}

export default ImportCsvPage;