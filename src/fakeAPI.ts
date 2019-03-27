import React, { useState, useEffect, useCallback } from "react";
import faker from "faker";

export interface Product {
  title: string;
  description: string;
  firstVariant: Variant;
  variants: Variant[];
}

export interface Variant {
  option: string;
  value: string;
  price: string;
}

export function useQuery(creating: boolean = true) {
  const [data, setData] = useState({
    title: "",
    description: "",
    firstVariant: { option: "Color", value: "", price: "" },
    variants: [] as Variant[]
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (creating) {
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setData({
        title: 'thing',
        description: faker.lorem.paragraph(),
        firstVariant: {
          option: "color",
          price: faker.commerce.price(),
          value: faker.commerce.color()
        },
        variants: [
          {
            option: "highlight color",
            value: "red",
            price: "0"
          },
          {
            option: "color",
            value: "blue",
            price: "0"
          },
          {
            option: "color",
            value: "green",
            price: "0"
          }
        ]
      });
    }, 2000);
  }, []);

  const update = useCallback(async (data: Product) => {
    await wait(2000);

    if (data.title.toLowerCase().includes('car')) {
      return [{
        fieldPath: ['title'],
        message: 'The server does not like cars. No cars allowed.',
      }]
    }

    setData(data);

    return [];
  }, []);

  return {
    data: {
      ...data,
      loading
    },
    update
  };
}

function wait(time: number) {
  return new Promise(resolve => {
    setTimeout(resolve, time);
  });
}
