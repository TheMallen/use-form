import React from "react";

import { useField, useList, useForm } from "./use-form";
import { ValidationContext } from "./use-form/types";
import { notEmpty, numeric, lengthMoreThan } from "./use-form/validation";

import { useQuery, Variant } from "./fakeAPI";

import {
  AppProvider,
  Page,
  TextField,
  FormLayout,
  Stack,
  Card,
  Layout,
  Form,
  ContextualSaveBar,
  Frame,
  Banner
} from "@shopify/polaris";

export default function App() {
  const { data, update } = useQuery();

  // You can use fields individually outside of a useForm
  const title = useField({
    value: data.title,
    validates: [
      notEmpty("Title is required"),
      lengthMoreThan(3, "Title must be more than 3 characters")
    ]
  });

  // this can let you do cool stuff like link fields to validate off one another
  const firstVariantPrice = useField({
    value: data.firstVariant.price,
    validates: {
      with: title.value,
      using(price: string, { linked }: ValidationContext<string>) {
        const priceAsNumber = parseFloat(price);
        if (
          linked.toLowerCase().includes("expensive") &&
          !(priceAsNumber > 1000)
        ) {
          return "Expensive items must cost more than 1000 dollars";
        }
      },
    }
  });

  // or you can define fields inline in the call to useForm
  const { fields, submit, submitting, dirty, reset, remoteErrors } = useForm({
    fields: {
      title,
      description: useField(data.description),
      firstVariant: {
        option: useField(data.firstVariant.option),
        price: firstVariantPrice,
        value: useField({
          value: data.firstVariant.value,
          validates: notEmpty("Variant values are required")
        })
      },
      variants: useList({
        list: data.variants,
        validates: {
          price: [
            notEmpty("Price is required"),
            numeric("Price must be a number")
          ],
          value: {
            using: [
              notEmpty("Variants must have values"),
              (
                value: string,
                { listItem, siblings }: ValidationContext<never, Variant>
              ) => {
                const { option } = listItem;
                const similarSiblings = siblings.filter(
                  sibling => sibling.option.value === option.value
                );
                const hasDuplicates = similarSiblings.some(
                  sibling => value === sibling.value.value
                );
                if (hasDuplicates) {
                  return "Value must be unique!";
                }
              }
            ]
          }
        }
      })
    },
    async onSubmit(form) {
      const remoteErrors = await update({
        ...form,
        variants: Array.from(form.variants)
      });

      if (remoteErrors.length > 0) {
        return { status: "fail", errors: remoteErrors };
      }

      return { status: "success" };
    }
  });

  // You can also use top level state individually
  // const reset = useReset(fields);
  // const [submit, submitting, remoteErrors] = useSubmit(async form => {
  //   const remoteErrors = await update({
  //     ...form,
  //     variants: Array.from(form.variants)
  //   });

  //   if (remoteErrors.length > 0) {
  //     return { status: "fail", errors: remoteErrors };
  //   }

  //   return { status: "success" };
  // }, fields);

  return (
    <AppProvider>
      <Frame>
        <Form onSubmit={submit}>
          <Page title={data.title || "..."}>
            {dirty && (
              <ContextualSaveBar
                message="Unsaved product"
                saveAction={{
                  onAction: submit,
                  loading: submitting,
                  disabled: false
                }}
                discardAction={{
                  onAction: reset
                }}
              />
            )}
            <Layout>
              {remoteErrors.length > 0 && (
                <Layout.Section>
                  <Banner status="critical">{remoteErrors.join("\n")}</Banner>
                </Layout.Section>
              )}
              <Layout.Section>
                <Card>
                  <Card.Section>
                    <FormLayout>
                      <TextField label="Title" {...fields.title} />
                      <TextField
                        multiline
                        label="Description"
                        disabled={data.loading}
                        {...fields.description}
                      />
                    </FormLayout>
                  </Card.Section>
                </Card>
                <Card>
                  <Card.Section>
                    <FormLayout>
                      <TextField
                        label="Option"
                        disabled
                        {...fields.firstVariant.option}
                      />
                      <TextField
                        label="Value"
                        disabled={data.loading}
                        {...fields.firstVariant.value}
                      />
                      <TextField
                        label="Price"
                        type="currency"
                        disabled={data.loading}
                        {...fields.firstVariant.price}
                      />
                    </FormLayout>
                  </Card.Section>
                  {fields.variants.length > 0 && (
                    <Card.Section>
                      <Stack vertical>
                        {fields.variants.map(variant => {
                          return (
                            <Stack vertical key={variant.option.defaultValue}>
                              <TextField
                                label="Option"
                                disabled
                                {...variant.option}
                              />
                              <TextField
                                label="Value"
                                disabled={data.loading}
                                {...variant.value}
                              />
                              <TextField
                                label="Price"
                                disabled={data.loading}
                                {...variant.price}
                              />
                            </Stack>
                          );
                        })}
                      </Stack>
                    </Card.Section>
                  )}
                </Card>
              </Layout.Section>
            </Layout>
          </Page>
        </Form>
      </Frame>
    </AppProvider>
  );
}
