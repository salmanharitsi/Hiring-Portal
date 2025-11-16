"use client";

import JobTypeSelect from "./JobTypeSelect";

const WORK_MODES = ["Onsite", "Remote", "Hybrid", "Jarak Jauh"] as const;

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function WorkModeSelect({
  value,
  onChange,
  placeholder = "Select work mode",
}: Props) {
  return (
    <JobTypeSelect
      value={value}
      onChange={onChange}
      options={WORK_MODES.map((wm) => ({
        value: wm,
        label: wm,
      }))}
      placeholder={placeholder}
    />
  );
}
