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
