import {
  ObjectId,
} from "mongodb";

export function monthFromDate(
  date: string
) {
  const value =
    String(
      date || ""
    ).trim();

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
    return "";
  }

  return value.slice(
    0,
    7
  );
}

export async function isMonthClosed(
  db: any,
  businessId: unknown,
  businessSlug: string | undefined,
  dateOrMonth: string
) {
  const month =
    /^\d{4}-\d{2}$/.test(
      dateOrMonth
    )
      ? dateOrMonth
      : monthFromDate(
          dateOrMonth
        );

  if (!month) {
    return false;
  }

  const filters =
    makeBusinessFilters(
      businessId,
      businessSlug
    );

  const closing =
    await db
      .collection(
        "monthly_closings"
      )
      .findOne({
        month,

        status:
          "closed",

        $or:
          filters,
      });

  return Boolean(
    closing
  );
}

export function makeBusinessFilters(
  businessId: unknown,
  businessSlug?: string
) {
  const value =
    String(
      businessId || ""
    ).trim();

  const filters: any[] =
    [];

  if (value) {
    filters.push({
      businessId:
        value,
    });
  }

  if (
    ObjectId.isValid(
      value
    )
  ) {
    filters.push({
      businessId:
        new ObjectId(
          value
        ),
    });
  }

  if (
    businessSlug
  ) {
    filters.push({
      businessSlug,
    });
  }

  return filters;
}
