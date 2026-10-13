"use client";

import { useState } from "react";
import { FenderListingsTable } from "@/components/v3/live/FenderListingsTable";

export function ExploreListings() {
  const [open, setOpen] = useState(false);

  return (
    <div className="content-box retail-explore-box">
      <button
        type="button"
        className="retail-explore"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        Explore all listings
        <svg
          className="retail-explore-chevron"
          viewBox="0 0 12 12"
          width="12"
          height="12"
          aria-hidden="true"
        >
          <path
            d="M2.2 4.2 6 8l3.8-3.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <p className="retail-missing">
        {open
          ? "Every stored listing in this read, with filters and links back to the source page."
          : "The full listing table stays closed until you open it."}
      </p>
      {open ? <FenderListingsTable /> : null}
    </div>
  );
}
