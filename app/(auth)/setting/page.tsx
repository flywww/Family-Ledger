'use client'

import { Button } from "@/components/ui/button";


export default function Page() {
    return (
      <div>
        <p>Setting Page</p>
        <Button onClick={()=>{
          fetch('/api/create-valueData', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'value' }) // Adjust payload as needed
          })
          .then(response => response.json())
          .then(data => console.log(data))
          .catch(error => console.error(error));
        }}> Create valueData </Button>
        <br />
        <Button onClick={()=>{
          fetch('/api/update-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'value' })
          })
          .then(response => response.json())
          .then(data => console.log(data))
          .catch(error => console.error(error))
        }}> Update Password </Button>
      </div>
    );
  }