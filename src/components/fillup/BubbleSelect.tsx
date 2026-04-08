type Props = {
  items: readonly string[];
  selected: string[];
  onChange: (val: string[]) => void;
};

export default function BubbleSelect({ items, selected, onChange }: Props) {
  const toggle = (item: string) => {
    if (selected.includes(item)) {
      onChange(selected.filter((i) => i !== item));
    } else {
      onChange([...selected, item]);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => {
        const isActive = selected.includes(item);

        return (
          <button
            key={item}
            onClick={() => toggle(item)}
            className={`
              px-4 py-2 text-sm font-medium rounded-full border-2
              transition-all duration-300
              ${
                isActive
                  ? "bg-[#8B5CF6] text-white border-[#1E293B] shadow-[4px_4px_0px_#1E293B]"
                  : "bg-white text-[#1E293B] border-[#1E293B] shadow-[2px_2px_0px_#E2E8F0]"
              }
              hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#1E293B]
              active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_#1E293B]
            `}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}