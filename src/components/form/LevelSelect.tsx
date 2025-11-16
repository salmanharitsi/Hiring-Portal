"use client";

import JobTypeSelect from "./JobTypeSelect";

const LEVEL_OPTIONS = [
  "Junior (0 - 1 tahun)",
  "Pemula (0 - 3 tahun)",
  "Mid-Level (2 - 4 tahun)",
  "Senior (5+ tahun)",
  "Profesional (7+ tahun)",
] as const;

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function LevelSelect({
  value,
  onChange,
  placeholder = "Select level",
}: Props) {
  return (
    <JobTypeSelect
      value={value}
      onChange={onChange}
      options={LEVEL_OPTIONS.map((lv) => ({
        value: lv,
        label: lv,
      }))}
      placeholder={placeholder}
    />
  );
}
