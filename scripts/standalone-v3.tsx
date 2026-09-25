import { createRoot } from "react-dom/client";
import { FenderBrandCanvas } from "../components/v3/FenderBrandCanvas";

const root = document.getElementById("root");
if (root) createRoot(root).render(<FenderBrandCanvas />);
