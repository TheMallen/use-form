import React, { useState } from "react";

import {
  useField,
  useList,
  useForm,
  ListValidationContext,
  FieldDictionary
} from "./use-form";
import { notEmpty, numeric, lengthMoreThan } from "./use-form/validation";

import { useQuery, Variant } from "./fakeAPI";

import {
  Page,
  TextField,
  FormLayout,
  Card,
  Layout,
  Form,
  ContextualSaveBar,
  Frame,
  Banner
} from "@shopify/polaris";

export default function App() {
  const [creating] = useState(true);
  const { data, update } = useQuery(creating);

  // You can use fields individually outside of a useForm
  const title = useField({
    value: data.title,
    validates: [
      notEmpty("Title is required"),
      lengthMoreThan(3, "Title must be more than 3 characters")
    ]
  });

  // this can let you do cool stuff like link fields to validate off one another (or anything)
  const firstVariantPrice = useField({
    value: data.firstVariant.price,
    validates: {
      with: title.value,
      using(price: string, { linked }) {
        const priceAsNumber = parseFloat(price);
        if (
          linked.toLowerCase().includes("expensive") &&
          !(priceAsNumber > 1000)
        ) {
          return "Expensive items must cost more than 1000 dollars";
        }
      }
    }
  });

  // each field also has imperative methods for find grained control in edge-cases
  // eg.
  // firstVariantPrice.updateDefaultValue('88888');

  // or you can define fields inline in the call to useForm
  const { fields, submit, submitting, dirty, reset, submitErrors } = useForm({
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
                { siblings, listItem }: ListValidationContext<never, Variant>
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
      // the fake API will return an error if your title (case insensitive) includes 'car'
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

  const pageTitle = data.loading
    ? data.title || "..."
    : data.title || "New Product";

  console.log(submitErrors);

  return (
    <Frame>
      <Form onSubmit={submit}>
        <Page title={pageTitle}>
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
            {submitErrors.length > 0 && (
              <Layout.Section>
                <Banner status="critical">
                  <p>There were some issues with your form submission:</p>
                  <ul>
                    {submitErrors.map(({ message }, index) => {
                      return <li key={`${message}${index}`}>{message}</li>;
                    })}
                  </ul>
                </Banner>
              </Layout.Section>
            )}
            <Layout.Section>
              <Card>
                <Card.Section>
                  <FormLayout>
                    <TextField
                      label="Title"
                      disabled={data.loading}
                      {...fields.title}
                    />
                    <TextField
                      multiline
                      label="Description"
                      disabled={data.loading}
                      {...fields.description}
                    />
                  </FormLayout>
                </Card.Section>
              </Card>
              <VariantCard variant={fields.firstVariant} />

              {fields.variants.length > 0 && (
                fields.variants.map(variant => {
                  return <VariantCard variant={variant} />;
                })
              )}
            </Layout.Section>
          </Layout>
        </Page>
      </Form>
    </Frame>
  );
}

function VariantCard({
  variant,
}: {
  variant: FieldDictionary<Variant>;
}) {
  return (
    <Card>
      <Card.Section>
        <FormLayout>
          <TextField label="Option" disabled {...variant.option} />
          <TextField label="Value" {...variant.value} />
          <TextField label="Price" type="currency" {...variant.price} />
        </FormLayout>
      </Card.Section>
    </Card>
  );
}
