'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Location } from '@/types/auth';

interface LocationSelectorProps {
  className?: string;
  showLabel?: boolean;
  compact?: boolean;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  className = '',
  showLabel = true,
  compact = false,
}) => {
  const { 
    locations, 
    currentLocation, 
    switchLocation, 
    isLoading 
  } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const handleLocationChange = async (locationId: string) => {
    if (locationId === currentLocation?.id) {
      setIsOpen(false);
      return;
    }

    setIsSwitching(true);
    try {
      await switchLocation(locationId);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch location:', error);
    } finally {
      setIsSwitching(false);
    }
  };

  const getLocationDisplay = (location: Location) => {
    if (compact) {
      return location.code;
    }
    return `${location.name} (${location.code})`;
  };

  if (!locations || locations.length <= 1) {
    return null;
  }

  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <select
          value={currentLocation?.id || ''}
          onChange={(e) => handleLocationChange(e.target.value)}
          disabled={isLoading || isSwitching}
          className="block w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {getLocationDisplay(location)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {showLabel && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Current Location
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading || isSwitching}
          className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="block truncate">
            {currentLocation ? getLocationDisplay(currentLocation) : 'Select Location'}
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            {isSwitching ? (
              <svg
                className="animate-spin h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
            {locations.map((location) => (
              <button
                key={location.id}
                onClick={() => handleLocationChange(location.id)}
                className={`${
                  currentLocation?.id === location.id
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-900 hover:bg-gray-100'
                } relative cursor-default select-none py-2 pl-3 pr-9 w-full text-left`}
              >
                <span className="block truncate">
                  {getLocationDisplay(location)}
                  {location.is_primary && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Primary
                    </span>
                  )}
                  {currentLocation?.id === location.id && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg
                        className="h-5 w-5 text-blue-600"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {currentLocation && (
        <div className="mt-2 text-xs text-gray-500">
          {currentLocation.address && (
            <div className="flex items-center">
              <svg
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314-1.314l4.243 4.243a1.998 1.998 0 002.829 0l4.244-4.244A8 8 0 0117.657 16.657z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 11l3 3m0 0l-3-3m3 3v-6"
                />
              </svg>
              {currentLocation.address}
            </div>
          )}
          {currentLocation.timezone && (
            <div className="flex items-center mt-1">
              <svg
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {currentLocation.timezone}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationSelector;