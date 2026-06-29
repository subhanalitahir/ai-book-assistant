import React from "react";
import UploadForm from "@/components/UploadForm";

const page = () => {
  return (
    <div className="wrapper container">
      <div className="mx-auto max-w-2xl space-y-10">
        <section className="flex flex-col gap-5">
          <h1 className="page-title-xl">Add a New Book</h1>
          <p className="subtitle">
            Upload a PDF to generate your interactive reading experience.
          </p>
        </section>
        <UploadForm />
      </div>
    </div>
  );
};

export default page;
