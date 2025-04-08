import { RefreshCcw, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SearchFilterHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  sportFilter: string;
  onSportChange: (value: string) => void;
  categories: string[];
  sports: string[];
  onRefresh: () => void;
}

export default function SearchFilterHeader({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  sportFilter,
  onSportChange,
  categories,
  sports,
  onRefresh
}: SearchFilterHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="font-roboto font-bold text-2xl text-primary mb-4 md:mb-0">Sports League Logos</h1>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onRefresh}
            title="Refresh league images"
            className="hidden md:flex"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search leagues..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-4 w-full md:w-64"
              />
            </div>
          </div>
          
          <Select value={categoryFilter} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Categories">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sportFilter} onValueChange={onSportChange}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Select sport" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Sports">All Sports</SelectItem>
              {sports.map((sport) => (
                <SelectItem key={sport} value={sport}>
                  {sport}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={onRefresh}
            className="md:hidden"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}
